import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { query, queryOne, withTransaction } from "./db";
import {
  SESSION_COOKIE,
  SESSION_TTL_HOURS,
  adminCredentials,
  sessionSecret,
} from "./config";

export type AdminUser = {
  id: string;
  username: string;
  display_name: string;
  last_login_at: string | null;
};

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const RATE_WINDOW_MINUTES = 15;
const RATE_MAX_ATTEMPTS = 10;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Still compare something of equal length to keep timing flat.
    timingSafeEqual(left, Buffer.alloc(left.length));
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Make sure exactly one admin account exists, seeded from the environment.
 * The plaintext password is used once to create a bcrypt hash and is never
 * written anywhere. Changing ADMIN_PASSWORD in the environment rotates the
 * stored hash on the next deploy.
 */
export async function ensureAdminAccount(): Promise<void> {
  const { username, password } = adminCredentials();
  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME / ADMIN_PASSWORD are not configured on the server.",
    );
  }

  const existing = await queryOne<{
    id: string;
    username: string;
    password_hash: string;
  }>("select id, username, password_hash from admin_users order by created_at limit 1");

  if (existing) {
    const matches = await bcrypt.compare(password, existing.password_hash);
    if (!matches || existing.username !== username) {
      const hash = await bcrypt.hash(password, 12);
      await query(
        "update admin_users set username = $2, password_hash = $3, failed_attempts = 0, locked_until = null where id = $1",
        [existing.id, username, hash],
      );
      // Credentials rotated → drop every existing session.
      await query("update admin_sessions set revoked_at = now() where revoked_at is null");
    }
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await query(
    `insert into admin_users (username, password_hash, display_name)
     values ($1, $2, 'Yousuf')
     on conflict (username) do nothing`,
    [username, hash],
  );
}

export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return store.get("x-real-ip") ?? "unknown";
}

export type LoginResult =
  | { ok: true; user: AdminUser; token: string }
  | { ok: false; code: "invalid" | "locked" | "rate_limited"; retryAfterSeconds?: number };

export async function login(
  rawUsername: string,
  password: string,
): Promise<LoginResult> {
  await ensureAdminAccount();
  const username = rawUsername.trim().toLowerCase();
  const ip = await clientIp();

  const recent = await queryOne<{ count: string }>(
    `select count(*)::text as count from login_attempts
      where success = false and created_at > now() - ($1 || ' minutes')::interval
        and (identifier = $2 or ip = $3)`,
    [String(RATE_WINDOW_MINUTES), username, ip],
  );
  if (Number(recent?.count ?? 0) >= RATE_MAX_ATTEMPTS) {
    return { ok: false, code: "rate_limited", retryAfterSeconds: RATE_WINDOW_MINUTES * 60 };
  }

  const admin = await queryOne<AdminUser & { password_hash: string; failed_attempts: number; locked_until: string | null }>(
    "select id, username, display_name, password_hash, failed_attempts, locked_until, last_login_at from admin_users where lower(username) = $1 limit 1",
    [username],
  );

  const lockedFor = admin?.locked_until
    ? Math.ceil((new Date(admin.locked_until).getTime() - Date.now()) / 1000)
    : 0;
  if (lockedFor > 0) {
    return { ok: false, code: "locked", retryAfterSeconds: lockedFor };
  }

  if (!admin) {
    // Compare against a dummy hash so a missing user costs the same as a wrong password.
    await bcrypt.compare(password, "$2b$12$C6UzMDM.H6dfI/f/IKcEe.eH0lVcQ3m1p8o5t3nE1o1Xy0n5C9yQ6");
    await recordAttempt(username, ip, false);
    return { ok: false, code: "invalid" };
  }

  const matches = await bcrypt.compare(password, admin.password_hash);
  if (!matches) {
    const failed = admin.failed_attempts + 1;
    const lockUntil =
      failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
    await query(
      "update admin_users set failed_attempts = $2, locked_until = $3 where id = $1",
      [admin.id, failed >= MAX_FAILED ? 0 : failed, lockUntil],
    );
    await recordAttempt(username, ip, false);
    if (lockUntil) return { ok: false, code: "locked", retryAfterSeconds: LOCK_MINUTES * 60 };
    return { ok: false, code: "invalid" };
  }

  const token = await createSession(admin.id);
  await query(
    "update admin_users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = $1",
    [admin.id],
  );
  await recordAttempt(username, ip, true);
  return {
    ok: true,
    user: { id: admin.id, username: admin.username, display_name: admin.display_name, last_login_at: admin.last_login_at },
    token,
  };
}

async function recordAttempt(identifier: string, ip: string, success: boolean) {
  await query(
    "insert into login_attempts (identifier, ip, success) values ($1, $2, $3)",
    [identifier, ip, success],
  );
}

export async function createSession(adminId: string): Promise<string> {
  const jti = crypto.randomUUID();
  const tokenHash = sha256(jti);
  const expires = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000);
  const store = await headers();

  await query(
    `insert into admin_sessions (admin_id, token_hash, user_agent, expires_at)
     values ($1, $2, $3, $4)`,
    [adminId, tokenHash, store.get("user-agent")?.slice(0, 300) ?? null, expires],
  );

  const jwt = await new SignJWT({ sub: adminId, jti })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expires.getTime() / 1000))
    .setIssuer("for-samee")
    .setAudience("admin")
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });

  return jwt;
}

/** Resolve the signed-in admin, or null. Verifies JWT + the server-side session row. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      issuer: "for-samee",
      audience: "admin",
    });
    const jti = String(payload.jti ?? "");
    const sub = String(payload.sub ?? "");
    if (!jti || !sub) return null;

    const row = await queryOne<AdminUser>(
      `select u.id, u.username, u.display_name, u.last_login_at
         from admin_sessions s
         join admin_users u on u.id = s.admin_id
        where s.token_hash = $1 and s.admin_id = $2
          and s.revoked_at is null and s.expires_at > now()
        limit 1`,
      [sha256(jti), sub],
    );
    return row;
  } catch {
    return null;
  }
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, sessionSecret(), {
        issuer: "for-samee",
        audience: "admin",
      });
      if (payload.jti) {
        await query(
          "update admin_sessions set revoked_at = now() where token_hash = $1",
          [sha256(String(payload.jti))],
        );
      }
    } catch {
      /* expired or tampered cookie — just clear it */
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function cleanupExpiredSessions(): Promise<void> {
  await withTransaction(async (tx) => {
    await tx.query("delete from admin_sessions where expires_at < now() - interval '7 days'");
    await tx.query("delete from login_attempts where created_at < now() - interval '30 days'");
  });
}

export { safeEqual };
