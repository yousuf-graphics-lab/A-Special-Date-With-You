import { NextResponse } from "next/server";
import { ensureVisitor, readVisitor } from "@/lib/visitor";
import { currentPlanForVisitor, savePlan } from "@/lib/plan";
import { planSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const visitor = await readVisitor();
  if (!visitor) {
    return NextResponse.json({ plan: null }, { headers: { "Cache-Control": "no-store" } });
  }
  const plan = await currentPlanForVisitor(visitor.id);
  return NextResponse.json(
    { plan, unlocked: Boolean(visitor.unlocked_at), accepted: Boolean(visitor.accepted_at) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }

  const visitor = (await readVisitor()) ?? (await ensureVisitor());
  if (!visitor.unlocked_at) {
    return NextResponse.json(
      { ok: false, error: "The surprise is still locked, my love." },
      { status: 403 },
    );
  }

  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "A couple of little things still need your attention.", fieldErrors },
      { status: 422 },
    );
  }

  try {
    const result = await savePlan(visitor.id, parsed.data);
    return NextResponse.json(
      {
        ok: true,
        created: result.created,
        changed: result.changed,
        plan: result.response,
        message: result.changed
          ? result.created
            ? "Saved, my love."
            : "I have updated our little plan."
          : "Everything is already saved, my love.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[plan] save failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Something went wrong on my side. Please try saving again.",
      },
      { status: 500 },
    );
  }
}
