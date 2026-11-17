import { NextResponse } from "next/server";
import { ensureVisitor, readVisitor, touchVisit } from "@/lib/visitor";
import { currentPlanForVisitor } from "@/lib/plan";

export const runtime = "nodejs";

type Journey = {
  unlocked_at: string | null;
  accepted_at: string | null;
  thinking_at: string | null;
  submitted_at: string | null;
};

/** Where she left off, so a later visit does not restart the story. */
function resumeStage(visitor: Journey): "lock" | "letter" | "planner" | "finale" {
  if (!visitor.unlocked_at) return "lock";
  if (visitor.submitted_at) return "finale";
  if (visitor.accepted_at) return "planner";
  return "letter";
}
export const dynamic = "force-dynamic";

/**
 * Called once when the experience mounts. Establishes the anonymous visitor
 * cookie and counts the visit. Returns only progress flags — never anything
 * about the owner's side.
 */
export async function POST() {
  const existing = await readVisitor();
  const visitor = existing ?? (await ensureVisitor());
  if (existing) await touchVisit(existing);

  return NextResponse.json(
    {
      unlocked: Boolean(visitor.unlocked_at),
      letterOpened: Boolean(visitor.letter_opened_at),
      accepted: Boolean(visitor.accepted_at),
      submitted: Boolean(visitor.submitted_at),
      thinking: Boolean(visitor.thinking_at),
      /** Lets the client resume exactly where she stopped. */
      stage: resumeStage(visitor),
      plan: visitor.unlocked_at ? await currentPlanForVisitor(visitor.id) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
