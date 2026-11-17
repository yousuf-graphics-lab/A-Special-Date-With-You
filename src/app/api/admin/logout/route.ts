import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/admin-auth";
import { assertSameOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  await destroyCurrentSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
