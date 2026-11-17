import { NextResponse } from "next/server";
import { login } from "@/lib/admin-auth";
import { hasAdminCredentials, sessionSecretConfigured } from "@/lib/config";
import { loginSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertSameOrigin(request))) {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Enter your username and password." },
      { status: 400 },
    );
  }

  if (!hasAdminCredentials() || !sessionSecretConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Dashboard login is not configured yet. Set ADMIN_USERNAME, ADMIN_PASSWORD and SESSION_SECRET.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await login(parsed.data.username, parsed.data.password);
    if (!result.ok) {
      const message =
        result.code === "locked"
          ? "Too many attempts. This login is paused for a few minutes."
          : result.code === "rate_limited"
            ? "Too many attempts from here. Please wait a little while."
            : "Those details do not match. Try again.";
      return NextResponse.json(
        { ok: false, error: message, retryAfterSeconds: result.retryAfterSeconds },
        {
          status: result.code === "invalid" ? 401 : 429,
          headers: result.retryAfterSeconds
            ? { "Retry-After": String(result.retryAfterSeconds) }
            : undefined,
        },
      );
    }

    return NextResponse.json(
      { ok: true, user: { username: result.user.username, displayName: result.user.display_name } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/login] failed", error);
    return NextResponse.json(
      { ok: false, error: "Login is not available right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
