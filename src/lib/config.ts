import "server-only";

/**
 * Server-side configuration. Nothing in this file is imported by a client
 * component, so secrets never reach the browser bundle.
 *
 * Every value below has a safe development fallback and a loud production
 * failure, so a missing environment variable can never silently ship the
 * birthday answer or a known password to the open web.
 */
import { randomBytes, scryptSync } from "node:crypto";

const DEV_FALLBACKS = {
  ADMIN_USERNAME: "samee_mine",
  ADMIN_PASSWORD: "samee_my_love",
  BIRTHDAY_LOCK_PASSWORD: "14112007",
};

const isProduction = process.env.NODE_ENV === "production";

export const IS_PROD = isProduction;
export const SESSION_COOKIE = "fsd_admin_session";
export const VISITOR_COOKIE = "fsd_visitor";
export const SESSION_TTL_HOURS = 12;

const warn = (message: string) => console.warn(`[for-samee] ${message}`);

/**
 * The birthday lock answer. It never reaches the browser: the route handler
 * compares it on the server with a timing-safe comparison.
 *
 * Returns null when it is not configured in production, which disables the
 * lock instead of falling back to a guessable default.
 */
export function birthdayLockSecret(): string | null {
  const value = process.env.BIRTHDAY_LOCK_PASSWORD?.trim();
  if (value) return value;
  if (!isProduction) return DEV_FALLBACKS.BIRTHDAY_LOCK_PASSWORD;
  warn("BIRTHDAY_LOCK_PASSWORD is not set — the birthday lock is disabled.");
  return null;
}

export function birthdayLockConfigured(): boolean {
  return birthdayLockSecret() !== null;
}

/** 32+ bytes for HS256. Rotating this signs out every existing session. */
export function sessionSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (raw && raw.length >= 32) return new TextEncoder().encode(raw);
  if (isProduction) {
    throw new Error(
      "SESSION_SECRET (32+ characters) is not configured. Generate one with: openssl rand -base64 48",
    );
  }
  // Stable local key so development sessions survive a restart.
  return new TextEncoder().encode(scryptSync("for-samee-local-dev", "fixed-salt", 32).toString("hex"));
}

export function sessionSecretConfigured(): boolean {
  const raw = process.env.SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  return Boolean(raw && raw.length >= 32);
}

export function adminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (username && password) return { username, password };
  if (isProduction) {
    warn("ADMIN_USERNAME / ADMIN_PASSWORD are not both set — dashboard login is disabled.");
    return { username: "", password: "" };
  }
  return {
    username: username || DEV_FALLBACKS.ADMIN_USERNAME,
    password: password || DEV_FALLBACKS.ADMIN_PASSWORD,
  };
}

export function hasAdminCredentials(): boolean {
  const { username, password } = adminCredentials();
  return Boolean(username && password);
}

/** True when the published example credentials are still in use. */
export function usingExampleCredentials(): boolean {
  const { username, password } = adminCredentials();
  return (
    username === DEV_FALLBACKS.ADMIN_USERNAME &&
    password === DEV_FALLBACKS.ADMIN_PASSWORD
  );
}

/** A short, human list of what is missing — for the owner, never for visitors. */
export function setupWarnings(): string[] {
  const problems: string[] = [];
  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL (Supabase Postgres)");
  if (!process.env.BIRTHDAY_LOCK_PASSWORD) problems.push("BIRTHDAY_LOCK_PASSWORD (the birthday date)");
  if (!sessionSecretConfigured()) problems.push("SESSION_SECRET (32+ characters)");
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    problems.push("ADMIN_USERNAME and ADMIN_PASSWORD");
  }
  return problems;
}

export const randomId = () => randomBytes(16).toString("hex");
