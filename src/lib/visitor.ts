import "server-only";
import { cookies } from "next/headers";
import { query, queryOne } from "./db";
import { VISITOR_COOKIE } from "./config";
import { newToken } from "./db";

export type Visitor = {
  id: string;
  token: string;
  visits: number;
  first_seen_at: string;
  last_seen_at: string;
  unlocked_at: string | null;
  letter_opened_at: string | null;
  accepted_at: string | null;
  thinking_at: string | null;
  submitted_at: string | null;
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

async function setVisitorCookie(token: string) {
  const store = await cookies();
  store.set(VISITOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Read the visitor token from the cookie. Read-only: safe inside Server
 * Components, where cookies cannot be modified.
 */
export async function readVisitor(): Promise<Visitor | null> {
  const store = await cookies();
  const token = store.get(VISITOR_COOKIE)?.value;
  if (!token || token.length < 20) return null;
  return queryOne<Visitor>("select * from visitors where token = $1 limit 1", [token]);
}

/**
 * Get (or create) the visitor for this browser. Only call from Route Handlers
 * or Server Actions, where setting a cookie is allowed.
 */
export async function ensureVisitor(): Promise<Visitor> {
  const existing = await readVisitor();
  if (existing) return existing;

  const token = newToken();
  const visitor = await queryOne<Visitor>(
    `insert into visitors (token, visits) values ($1, 1) returning *`,
    [token],
  );
  await setVisitorCookie(token);
  return visitor!;
}

export type VisitorEvent =
  | "visit"
  | "unlock"
  | "unlock_failed"
  | "letter_opened"
  | "accepted"
  | "thinking"
  | "submitted"
  | "updated"
  | "bouquet_opened"
  | "final_opened";

export async function recordEvent(
  visitorId: string | null,
  type: VisitorEvent,
  metadata: Record<string, unknown> = {},
) {
  await query(
    "insert into proposal_events (visitor_id, type, metadata) values ($1, $2, $3::jsonb)",
    [visitorId, type, JSON.stringify(metadata)],
  );
}

export async function touchVisit(visitor: Visitor): Promise<void> {
  await query(
    "update visitors set visits = visits + 1, last_seen_at = now() where id = $1",
    [visitor.id],
  );
  await recordEvent(visitor.id, "visit");
}

export async function markUnlocked(visitorId: string): Promise<void> {
  await query(
    "update visitors set unlocked_at = coalesce(unlocked_at, now()), last_seen_at = now() where id = $1",
    [visitorId],
  );
  await recordEvent(visitorId, "unlock");
}

export async function markAccepted(visitorId: string): Promise<void> {
  await query(
    "update visitors set accepted_at = coalesce(accepted_at, now()), last_seen_at = now() where id = $1",
    [visitorId],
  );
  await recordEvent(visitorId, "accepted");
}

export async function markThinking(visitorId: string): Promise<void> {
  await query(
    "update visitors set thinking_at = now(), last_seen_at = now() where id = $1",
    [visitorId],
  );
  await recordEvent(visitorId, "thinking");
}

/** The three "she got this far" moments the owner can see on the dashboard. */
export const MILESTONES = {
  letter_opened: { column: "letter_opened_at", event: "letter_opened" },
  bouquet_opened: { column: "bouquet_opened_at", event: "bouquet_opened" },
  final_opened: { column: "final_opened_at", event: "final_opened" },
} as const;

export type Milestone = keyof typeof MILESTONES;

export async function markMilestone(visitorId: string, milestone: Milestone): Promise<void> {
  const { column, event } = MILESTONES[milestone];
  await query(
    `update visitors set ${column} = coalesce(${column}, now()), last_seen_at = now() where id = $1`,
    [visitorId],
  );
  await recordEvent(visitorId, event);
}
