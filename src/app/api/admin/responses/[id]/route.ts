import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-auth";
import { getResponse, updateResponse } from "@/lib/admin-data";
import { responseUpdateSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const response = await getResponse(id);
  if (!response) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ response }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = responseUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 422 });
  }

  const updated = await updateResponse(id, parsed.data, admin.username);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, response: updated });
}
