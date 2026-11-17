import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const dynamic = "force-dynamic";

/**
 * Every dashboard page lives inside this layout, so authorisation is checked
 * once, on the server, before any of them render. /admin/login sits outside
 * this route group on purpose.
 */

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authorisation: a signed-in session row must exist. Anything
  // else goes back to the login screen — including a database that is not
  // reachable, so nothing private is ever rendered unauthenticated.
  const admin = await currentAdmin().catch(() => null);
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="sticky top-0 z-30 border-b border-gold/25 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg text-burgundy">Our Little Date</span>
            <span className="hidden text-[0.62rem] uppercase tracking-[0.28em] text-muted/80 sm:inline">
              private dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">
              Signed in as <span className="text-burgundy">{admin.username}</span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">{children}</main>
    </div>
  );
}
