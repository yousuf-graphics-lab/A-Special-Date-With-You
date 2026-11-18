import { NextResponse } from "next/server";
import {
  birthdayLockConfigured,
  hasAdminCredentials,
  sessionSecretConfigured,
} from "@/lib/config";
import { databaseConfigured, getBackend } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A single request that answers "why isn't it working?" — for the owner only.
 *
 * It reports booleans and never a secret, a password, a connection string or a
 * database host. The database flag is a real `select 1`, so it proves the
 * connection instead of merely reporting that a variable exists.
 */
async function databaseReachable(): Promise<boolean> {
  if (!databaseConfigured()) return false;
  try {
    await getBackend();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const db = await databaseReachable();

  const checks = {
    database: db,
    lockPassword: birthdayLockConfigured(),
    sessionSecret: sessionSecretConfigured(),
    adminCredentials: hasAdminCredentials(),
  };

  const ready =
    checks.database &&
    checks.lockPassword &&
    checks.sessionSecret &&
    checks.adminCredentials;

  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  return NextResponse.json(
    {
      ready,
      checks,
      /** Human names of the environment variables to look at, never values. */
      missingEnvVars: missing.map((name) =>
        name === "lockPassword"
          ? "BIRTHDAY_LOCK_PASSWORD"
          : name === "sessionSecret"
            ? "SESSION_SECRET"
            : name === "adminCredentials"
              ? "ADMIN_USERNAME / ADMIN_PASSWORD"
              : "DATABASE_URL",
      ),
      mode: process.env.DATABASE_URL ? "postgres" : "embedded",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
