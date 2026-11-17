import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { readVisitor, ensureVisitor, markUnlocked, recordEvent } from "@/lib/visitor";
import { birthdayLockSecret, birthdayLockConfigured } from "@/lib/config";
import { countRecent, requestIp } from "@/lib/rate-limit";
import { unlockSchema } from "@/lib/validation";
import { databaseConfigured, queryOne, DatabaseNotConfiguredError } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secureCompare(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    return await handleUnlock(request);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { ok: false, error: "This surprise is not quite ready yet." },
        { status: 503 },
      );
    }
    throw error;
  }
}

async function handleUnlock(request: Request) {
  if (!birthdayLockConfigured() || !databaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "This surprise is not quite ready yet." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = unlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Oops, my love! Try once more." }, { status: 400 });
  }

  const visitor = (await readVisitor()) ?? (await ensureVisitor());
  const ip = await requestIp();

  // Throttle guessing: per visitor and per IP.
  const visitorFailures = await countRecent(
    `select count(*) from proposal_events e join visitors v on v.id = e.visitor_id
      where v.id = $1 and e.type = 'unlock_failed'
        and e.created_at > now() - ($2 || ' minutes')::interval`,
    [visitor.id, "10"],
  );
  const ipFailures = await countRecent(
    `select count(*) from proposal_events
      where type = 'unlock_failed'
        and created_at > now() - ($1 || ' minutes')::interval
        and metadata->>'ip' = $2`,
    ["15", ip],
  );

  if (visitorFailures >= 6 || ipFailures >= 25) {
    return NextResponse.json(
      {
        ok: false,
        locked: true,
        error: "Let's take a tiny pause, my love. Try again in a few minutes.",
      },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  // Normalise: digits only, so "14 11 2007" or "14-11-2007" also feel natural.
  const normalise = (value: string) => value.replace(/[^0-9]/g, "");
  const supplied = normalise(parsed.data.password);
  const secret = birthdayLockSecret();
  if (!secret || !secureCompare(supplied, normalise(secret))) {
    await recordEvent(visitor.id, "unlock_failed", { ip });
    return NextResponse.json(
      { ok: false, error: "Oops, my love! Try once more." },
      { status: 401 },
    );
  }

  await markUnlocked(visitor.id);
  const updated = await queryOne<{ unlocked_at: string | null; visits: number }>(
    "select unlocked_at, visits from visitors where id = $1",
    [visitor.id],
  );

  return NextResponse.json(
    { ok: true, visits: updated?.visits ?? 1, unlockedAt: updated?.unlocked_at ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
