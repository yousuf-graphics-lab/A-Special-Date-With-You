import { databaseConfigured, databaseMode } from "@/lib/db";

/**
 * A small, honest storage indicator for the dashboard header.
 *
 * "Configured" and "connected" are different things, and conflating them is
 * what made an unreachable database look fine while saves silently failed. The
 * badge therefore says only what it can prove cheaply — whether DATABASE_URL is
 * present and which backend that selects. Real reachability lives at
 * /api/health, which actually issues a query, and the link says so.
 */
export function StorageBadge() {
  const configured = databaseConfigured();
  const mode = databaseMode();

  const label = configured
    ? mode === "postgres"
      ? "Supabase Postgres"
      : "Embedded (dev)"
    : "Not configured";

  return (
    <a
      href="/api/health"
      target="_blank"
      rel="noreferrer"
      title={
        configured
          ? "Storage is configured. Click for a live health check that actually queries the database."
          : "No database configured — nothing she saves can be stored. Set DATABASE_URL."
      }
      className={[
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.18em] transition sm:inline-flex",
        configured
          ? "border-sage/50 bg-sage/10 text-[#4c5c47] hover:bg-sage/20"
          : "border-gold/60 bg-gold/15 text-[#7a5c22] hover:bg-gold/25",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "h-1.5 w-1.5 rounded-full",
          configured ? "bg-sage" : "bg-gold",
        ].join(" ")}
      />
      {label}
    </a>
  );
}
