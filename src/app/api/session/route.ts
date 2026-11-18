import { NextResponse } from "next/server";
import { ensureVisitor, readVisitor, touchVisit, type Visitor } from "@/lib/visitor";
import { currentPlanForVisitor } from "@/lib/plan";

export const runtime = "nodejs";

type Journey = Pick<
  Visitor,
  | "unlocked_at"
  | "letter_opened_at"
  | "accepted_at"
  | "thinking_at"
  | "submitted_at"
  | "bouquet_opened_at"
>;

type ResumeStage = "lock" | "letter" | "proposal" | "planner" | "bouquet" | "finale";

/**
 * Where she left off, so a later visit does not restart the story.
 *
 * The bouquet used to be missing from this ladder entirely, so a visitor who
 * had saved her plan resumed straight at the finale and the bouquet was never
 * shown again — the step simply vanished. The milestone row already existed
 * (`bouquet_opened_at`), it just was not consulted.
 *
 * The order matters: the furthest milestone she actually reached wins.
 */
function resumeStage(visitor: Journey): ResumeStage {
  if (!visitor.unlocked_at) return "lock";
  if (visitor.submitted_at) {
    // The plan is saved. If she has not yet been shown the bouquet, that is
    // exactly where she is — not the finale.
    return visitor.bouquet_opened_at ? "finale" : "bouquet";
  }
  if (visitor.accepted_at) return "planner";
  if (visitor.letter_opened_at) return "proposal";
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
      bouquetOpened: Boolean(visitor.bouquet_opened_at),
      /** Lets the client resume exactly where she stopped. */
      stage: resumeStage(visitor),
      plan: visitor.unlocked_at ? await currentPlanForVisitor(visitor.id) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
