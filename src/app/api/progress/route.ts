import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureVisitor,
  markAccepted,
  markMilestone,
  markThinking,
  readVisitor,
} from "@/lib/visitor";
import { currentPlanForVisitor } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  event: z.enum([
    "letter_opened",
    "accepted",
    "thinking",
    "bouquet_opened",
    "final_opened",
  ]),
});

/** Records how far Samiya has travelled through the experience. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const visitor = (await readVisitor()) ?? (await ensureVisitor());

  switch (parsed.data.event) {
    case "accepted":
      await markAccepted(visitor.id);
      break;
    case "thinking":
      await markThinking(visitor.id);
      break;
    case "letter_opened":
    case "bouquet_opened":
    case "final_opened":
      await markMilestone(visitor.id, parsed.data.event);
      break;
  }

  const plan = await currentPlanForVisitor(visitor.id);
  return NextResponse.json(
    { ok: true, hasPlan: Boolean(plan) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
