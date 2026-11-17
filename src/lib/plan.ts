import "server-only";
import { query, queryOne, withTransaction } from "./db";
import type { PlanPayload } from "./validation";
import { toPlanColumns } from "./validation";
import { activityLabel, placeLabel } from "./date-options";

export type StoredResponse = {
  id: string;
  visitor_id: string;
  version: number;
  selected_date: string;
  selected_time: string;
  time_is_custom: boolean;
  location_label: string | null;
  location_custom: string | null;
  activities: string[];
  activity_custom: string | null;
  message: string | null;
  time_zone: string;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
};

export type PlanView = {
  id: string;
  version: number;
  date: string;
  time: string;
  timeIsCustom: boolean;
  placeLabel: string;
  placeCustom: string | null;
  placeId: string;
  activities: { id: string; label: string }[];
  activityCustom: string | null;
  message: string | null;
  status: string;
  adminNotes: string | null;
  submittedAt: string;
  updatedAt: string;
};

export function toPlanView(row: StoredResponse): PlanView {
  return {
    id: row.id,
    version: row.version,
    date: row.selected_date,
    time: row.selected_time,
    timeIsCustom: row.time_is_custom,
    placeId: row.location_label ?? "",
    placeLabel: placeLabel(row.location_label) ?? "Somewhere you choose",
    placeCustom: row.location_custom,
    activities: (row.activities ?? []).map((id) => ({ id, label: activityLabel(id) })),
    activityCustom: row.activity_custom,
    message: row.message,
    status: row.status,
    adminNotes: row.admin_notes,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

/** Postgres returns DATE as a JS Date; always read it back as text. */
export function isoDate(column: string, alias = ""): string {
  const ref = alias ? `${alias}.${column}` : column;
  return `to_char(${ref}, 'YYYY-MM-DD') as ${column}`;
}

/** Timestamps as ISO strings, so no timezone surprises reach the UI. */
export function isoTimestamp(column: string, alias = ""): string {
  const ref = alias ? `${alias}.${column}` : column;
  return `to_char(${ref} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ${column}`;
}

export function responseColumns(alias = ""): string {
  const ref = (column: string) => (alias ? `${alias}.${column}` : column);
  return [
    ref("id"),
    ref("visitor_id"),
    ref("version"),
    ref("is_current"),
    isoDate("selected_date", alias),
    ref("selected_time"),
    ref("time_is_custom"),
    ref("location_label"),
    ref("location_custom"),
    ref("activities"),
    ref("activity_custom"),
    ref("message"),
    ref("time_zone"),
    ref("status"),
    ref("admin_notes"),
    isoTimestamp("reviewed_at", alias),
    isoTimestamp("submitted_at", alias),
    isoTimestamp("updated_at", alias),
  ].join(", ");
}

const snapshot = (row: StoredResponse) => ({
  version: row.version,
  selected_date: row.selected_date,
  selected_time: row.selected_time,
  time_is_custom: row.time_is_custom,
  location_label: row.location_label,
  location_custom: row.location_custom,
  activities: row.activities,
  activity_custom: row.activity_custom,
  message: row.message,
  status: row.status,
  submitted_at: row.submitted_at,
  updated_at: row.updated_at,
});

/**
 * Save a plan for this visitor.
 *
 * - First save inserts a response (version 1).
 * - A later save replaces the current row, bumps the version and archives the
 *   previous snapshot, so refreshing or going back never creates duplicates
 *   and the owner still has a clear history.
 * - Saving identical choices twice is a no-op (idempotent), which makes
 *   double-clicks and retries harmless.
 */
export async function savePlan(
  visitorId: string,
  payload: PlanPayload,
): Promise<{ response: PlanView; created: boolean; changed: boolean }> {
  const columns = toPlanColumns(payload);

  return withTransaction(async (tx) => {
    const current = (
      await tx.query<StoredResponse>(
        `select ${responseColumns()} from proposal_responses where visitor_id = $1 and is_current limit 1`,
        [visitorId],
      )
    ).rows[0];

    if (!current) {
      const inserted = (
        await tx.query<StoredResponse>(
          `insert into proposal_responses
             (visitor_id, version, selected_date, selected_time, time_is_custom,
              location_label, location_custom, activities, activity_custom, message)
           values ($1, 1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
           returning ${responseColumns()}`,
          [
            visitorId,
            columns.selectedDate,
            columns.selectedTime,
            columns.timeIsCustom,
            columns.locationLabel,
            columns.locationCustom,
            JSON.stringify(columns.activities),
            columns.activityCustom,
            columns.message,
          ],
        )
      ).rows[0]!;

      await tx.query(
        "update visitors set submitted_at = now(), last_seen_at = now() where id = $1",
        [visitorId],
      );
      await tx.query(
        "insert into proposal_events (visitor_id, type, metadata) values ($1, 'submitted', $2::jsonb)",
        [visitorId, JSON.stringify({ responseId: inserted.id, version: 1 })],
      );

      return { response: toPlanView(inserted), created: true, changed: true };
    }

    const same =
      current.selected_date === columns.selectedDate &&
      current.selected_time === columns.selectedTime &&
      current.time_is_custom === columns.timeIsCustom &&
      current.location_label === columns.locationLabel &&
      (current.location_custom ?? "") === (columns.locationCustom ?? "") &&
      JSON.stringify(current.activities ?? []) === JSON.stringify(columns.activities) &&
      (current.activity_custom ?? "") === (columns.activityCustom ?? "") &&
      (current.message ?? "") === (columns.message ?? "");

    // Private owner fields are deliberately preserved across her edits.
    if (same) {
      return { response: toPlanView(current), created: false, changed: false };
    }

    const version = current.version + 1;
    await tx.query(
      `insert into proposal_response_history (response_id, version, snapshot)
       values ($1, $2, $3::jsonb)`,
      [current.id, current.version, JSON.stringify(snapshot(current))],
    );

    const updated = (
      await tx.query<StoredResponse>(
        `update proposal_responses set
           version = $2,
           selected_date = $3,
           selected_time = $4,
           time_is_custom = $5,
           location_label = $6,
           location_custom = $7,
           activities = $8::jsonb,
           activity_custom = $9,
           message = $10,
           updated_at = now()
         where id = $1
         returning ${responseColumns()}`,
        [
          current.id,
          version,
          columns.selectedDate,
          columns.selectedTime,
          columns.timeIsCustom,
          columns.locationLabel,
          columns.locationCustom,
          JSON.stringify(columns.activities),
          columns.activityCustom,
          columns.message,
        ],
      )
    ).rows[0]!;

    await tx.query(
      "update visitors set submitted_at = now(), last_seen_at = now() where id = $1",
      [visitorId],
    );
    await tx.query(
      "insert into proposal_events (visitor_id, type, metadata) values ($1, 'updated', $2::jsonb)",
      [visitorId, JSON.stringify({ responseId: current.id, version })],
    );

    return { response: toPlanView(updated), created: false, changed: true };
  });
}

export async function currentPlanForVisitor(visitorId: string): Promise<PlanView | null> {
  const row = await queryOne<StoredResponse>(
    `select ${responseColumns()} from proposal_responses where visitor_id = $1 and is_current limit 1`,
    [visitorId],
  );
  return row ? toPlanView(row) : null;
}
