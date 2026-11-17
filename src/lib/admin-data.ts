import "server-only";
import { query, queryOne, withTransaction } from "./db";
import { responseColumns, isoDate, isoTimestamp, toPlanView, type PlanView, type StoredResponse } from "./plan";

export type Overview = {
  visits: number;
  uniqueVisitors: number;
  unlockAttempts: number;
  failedUnlocks: number;
  unlocked: boolean;
  unlockedAt: string | null;
  letterOpened: boolean;
  letterOpenedAt: string | null;
  bouquetOpenedAt: string | null;
  finalOpenedAt: string | null;
  accepted: boolean;
  acceptedAt: string | null;
  declinedForNow: boolean;
  thinkingAt: string | null;
  submitted: boolean;
  submittedAt: string | null;
  latestResponseAt: string | null;
  status: string;
  planPreview: PlanView | null;
};

export async function getOverview(): Promise<Overview> {
  const visitor = await queryOne<{
    id: string;
    first_seen_at: string;
    unlocked_at: string | null;
    letter_opened_at: string | null;
    bouquet_opened_at: string | null;
    final_opened_at: string | null;
    accepted_at: string | null;
    thinking_at: string | null;
    submitted_at: string | null;
  }>(
    `select id,
            ${isoTimestamp("first_seen_at")},
            ${isoTimestamp("unlocked_at")},
            ${isoTimestamp("letter_opened_at")},
            ${isoTimestamp("bouquet_opened_at")},
            ${isoTimestamp("final_opened_at")},
            ${isoTimestamp("accepted_at")},
            ${isoTimestamp("thinking_at")},
            ${isoTimestamp("submitted_at")}
       from visitors
      order by (unlocked_at is not null) desc, last_seen_at desc
      limit 1`,
  );

  const totals = await queryOne<{ visits: string; visitors: string }>(
    `select coalesce(sum(visits), 0)::text as visits, count(*)::text as visitors from visitors`,
  );

  const counters = await queryOne<{ unlocks: string; failed: string }>(
    `select
       count(*) filter (where type = 'unlock')::text as unlocks,
       count(*) filter (where type = 'unlock_failed')::text as failed
     from proposal_events`,
  );

  const latest = await queryOne<StoredResponse>(
    `select ${responseColumns()} from proposal_responses where is_current order by submitted_at desc limit 1`,
  );

  return {
    visits: Number(totals?.visits ?? 0),
    uniqueVisitors: Number(totals?.visitors ?? 0),
    unlockAttempts: Number(counters?.unlocks ?? 0),
    failedUnlocks: Number(counters?.failed ?? 0),
    unlocked: Boolean(visitor?.unlocked_at),
    unlockedAt: visitor?.unlocked_at ?? null,
    letterOpened: Boolean(visitor?.letter_opened_at),
    letterOpenedAt: visitor?.letter_opened_at ?? null,
    bouquetOpenedAt: visitor?.bouquet_opened_at ?? null,
    finalOpenedAt: visitor?.final_opened_at ?? null,
    accepted: Boolean(visitor?.accepted_at),
    acceptedAt: visitor?.accepted_at ?? null,
    declinedForNow: !visitor?.accepted_at && Boolean(visitor?.thinking_at),
    thinkingAt: visitor?.thinking_at ?? null,
    submitted: Boolean(visitor?.submitted_at),
    submittedAt: visitor?.submitted_at ?? null,
    latestResponseAt: latest?.submitted_at ?? null,
    status: latest?.status ?? "new",
    planPreview: latest ? toPlanView(latest) : null,
  };
}

export type ResponseWithHistory = PlanView & {
  history: { version: number; replacedAt: string; snapshot: Record<string, unknown> }[];
  acceptedAt: string | null;
  visitorFirstSeen: string | null;
  events: { type: string; createdAt: string }[];
};

export async function listResponses(): Promise<ResponseWithHistory[]> {
  const rows = await query<StoredResponse & { accepted_at: string | null; first_seen_at: string | null; visitor_id: string }>(
    `select ${responseColumns("r")},
            ${isoTimestamp("accepted_at", "v")},
            ${isoTimestamp("first_seen_at", "v")}
       from proposal_responses r
       join visitors v on v.id = r.visitor_id
      where r.is_current
      order by r.submitted_at desc`,
  );

  if (rows.length === 0) return [];

  const history = await query<{ response_id: string; version: number; snapshot: Record<string, unknown>; replaced_at: string }>(
    `select response_id, version, snapshot, ${isoTimestamp("replaced_at")}
       from proposal_response_history
      where response_id = any($1::uuid[])
      order by version desc`,
    [rows.map((row) => row.id)],
  );

  const events = await query<{ visitor_id: string; type: string; created_at: string }>(
    `select visitor_id, type, ${isoTimestamp("created_at")} from proposal_events
      where visitor_id = any($1::uuid[])
      order by created_at asc`,
    [rows.map((row) => row.visitor_id)],
  );

  return rows.map((row) => ({
    ...toPlanView(row),
    acceptedAt: row.accepted_at,
    visitorFirstSeen: row.first_seen_at,
    history: history
      .filter((entry) => entry.response_id === row.id)
      .map((entry) => ({
        version: entry.version,
        replacedAt: entry.replaced_at,
        snapshot: entry.snapshot,
      })),
    events: events
      .filter((event) => event.visitor_id === row.visitor_id)
      .map((event) => ({ type: event.type, createdAt: event.created_at })),
  }));
}

export async function getResponse(id: string): Promise<ResponseWithHistory | null> {
  const all = await listResponses();
  return all.find((response) => response.id === id) ?? null;
}

export async function updateResponse(
  id: string,
  input: { status?: string; adminNotes?: string; markReviewed?: boolean },
  actor = "yousuf",
): Promise<PlanView | null> {
  return withTransaction(async (tx) => {
    const existing = (
      await tx.query<StoredResponse>(
        `select ${responseColumns()} from proposal_responses where id = $1 and is_current limit 1`,
        [id],
      )
    ).rows[0];
    if (!existing) return null;

    const nextStatus = input.markReviewed ? "reviewed" : input.status ?? existing.status;
    const nextNotes = input.adminNotes === undefined ? existing.admin_notes : input.adminNotes.trim() || null;
    const reviewedAt =
      nextStatus !== "new" || input.markReviewed ? existing.reviewed_at ?? new Date().toISOString() : existing.reviewed_at;

    const row = (
      await tx.query<StoredResponse>(
        `update proposal_responses
            set status = $2, admin_notes = $3, reviewed_at = $4, updated_at = now()
          where id = $1
          returning ${responseColumns()}`,
        [id, nextStatus, nextNotes, reviewedAt],
      )
    ).rows[0]!;

    await tx.query(
      "insert into admin_notes_log (response_id, actor, action, detail) values ($1, $2, $3, $4::jsonb)",
      [
        id,
        actor,
        "response_updated",
        JSON.stringify({ status: nextStatus, notesChanged: nextNotes !== existing.admin_notes }),
      ],
    );

    return toPlanView(row);
  });
}

/** One answer for "has she responded yet?" — used by the dashboard and exports. */
export async function currentResponse(): Promise<ResponseWithHistory | null> {
  const all = await listResponses();
  return all[0] ?? null;
}
