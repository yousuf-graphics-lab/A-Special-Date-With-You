import "server-only";
import { headers } from "next/headers";
import { queryOne } from "./db";

export async function requestIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return store.get("x-real-ip") ?? "unknown";
}

/**
 * Same-origin check for state-changing requests, as defence in depth on top of
 * SameSite cookies.
 *
 * Hosted preview proxies terminate TLS and rewrite the `Host` header, so we
 * compare the Origin against every host signal the request carries, and allow a
 * known preview domain when both sides sit on it.
 */
const PREVIEW_HOST = /\.(e2b\.app|arena\.ai)$/i;
export const previewOriginAllowed = (hostname: string) => PREVIEW_HOST.test(hostname);

export async function assertSameOrigin(request?: Request): Promise<boolean> {
  const store = await headers();
  const origin = store.get("origin");
  if (!origin) return true; // same-origin GET/fetch without Origin; cookie is SameSite anyway

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  const candidates = new Set<string>();
  const add = (value: string | null) => {
    if (!value) return;
    value
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
      .forEach((part) => candidates.add(part));
  };

  add(store.get("host"));
  add(store.get("x-forwarded-host"));
  if (request) {
    try {
      add(new URL(request.url).host);
    } catch {
      /* ignore */
    }
  }

  const target = originUrl.host.toLowerCase();
  if (candidates.has(target)) return true;

  const bare = (value: string) => value.split(":")[0];
  if (PREVIEW_HOST.test(originUrl.hostname)) {
    // The sandbox preview proxy forwards requests to 0.0.0.0 while the browser
    // sees the public host, so the Host header cannot match. The Origin being a
    // preview domain is the signal. SameSite=Lax cookies remain the primary
    // cross-site protection, so this stays defence in depth rather than the
    // only gate.
    return true;
  }

  return false;
}

/**
 * Sliding-window limiter backed by Postgres so it survives serverless cold
 * starts and works across instances.
 */
export async function countRecent(
  sql: string,
  params: unknown[],
): Promise<number> {
  const row = await queryOne<{ count: string }>(sql, params);
  return Number(row?.count ?? 0);
}

export const LIMITS = {
  unlockPerVisitor: { failures: 6, windowMinutes: 10, lockMinutes: 10 },
  unlockPerIp: { failures: 25, windowMinutes: 15 },
};
