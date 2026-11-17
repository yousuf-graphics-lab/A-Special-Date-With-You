import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { SESSION_COOKIE } from "@/lib/config";
import { AdminLoginForm } from "@/components/admin/login-form";
import { AmbientLight } from "@/components/ambience";
import { WaxSeal } from "@/components/ornaments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  // Already signed in? Go straight to the dashboard. This is checked against
  // the session cookie only, so a database that is not reachable yet still
  // renders the form instead of bouncing in a redirect loop.
  const store = await cookies();
  const hasSessionCookie = Boolean(store.get(SESSION_COOKIE)?.value);
  if (hasSessionCookie) {
    const admin = await currentAdmin().catch(() => null);
    if (admin) redirect("/admin");
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-5 py-16">
      <AmbientLight variant="warm" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex">
            <WaxSeal initials="Y" />
          </span>
          <h1 className="font-display text-2xl text-burgundy">Private dashboard</h1>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-muted">
            Only for Yousuf. Samiya&apos;s answers stay here.
          </p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-2xl border border-gold/30 bg-cream/60" />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
