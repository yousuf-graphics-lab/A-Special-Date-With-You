import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  MessageSquareHeart,
  Sparkles,
  Users,
} from "lucide-react";
import { getOverview, listResponses } from "@/lib/admin-data";
import {
  STATUS_LABELS,
  formatDhakaDate,
  formatDhakaTimestamp,
  type ResponseStatus,
} from "@/lib/date-options";
import { ResponseEditor } from "@/components/admin/response-editor";
import { EmptyState } from "@/components/admin/empty-state";

export const dynamic = "force-dynamic";

const statusStyles: Record<ResponseStatus, string> = {
  new: "border-gold/50 bg-gold/15 text-[#7a5c22]",
  reviewed: "border-rose/60 bg-blush/50 text-burgundy",
  planning: "border-sage/50 bg-sage/15 text-[#4c5c47]",
  confirmed: "border-burgundy/40 bg-burgundy/10 text-burgundy",
  completed: "border-ink/20 bg-ink/5 text-ink/70",
};

export default async function AdminDashboardPage() {
  const [overview, responses] = await Promise.all([getOverview(), listResponses()]);
  const latest = responses[0] ?? null;
  const previous = responses.slice(1);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Everything, only for you</p>
          <h1 className="font-display text-3xl text-burgundy sm:text-4xl">Samee&apos;s little date</h1>
        </div>
        <p className="text-[0.7rem] uppercase tracking-[0.24em] text-muted/80">
          {overview.latestResponseAt
            ? `Latest response ${formatDhakaTimestamp(overview.latestResponseAt)}`
            : "No response yet"}
        </p>
      </div>

      {/* ------------------------------------------------------ OVERVIEW */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Eye}
            label="Proposal visits"
            value={String(overview.visits)}
            hint={`${overview.uniqueVisitors} unique ${overview.uniqueVisitors === 1 ? "visitor" : "visitors"}`}
          />
          <StatCard
            icon={LockKeyhole}
            label="Website unlocked"
            value={overview.unlocked ? "Yes" : "Not yet"}
            hint={
              overview.unlocked && overview.unlockedAt
                ? formatDhakaTimestamp(overview.unlockedAt)
                : `${overview.failedUnlocks} wrong ${overview.failedUnlocks === 1 ? "try" : "tries"} so far`
            }
            tone={overview.unlocked ? "good" : "neutral"}
          />
          <StatCard
            icon={HeartHandshake}
            label="Proposal accepted"
            value={overview.accepted ? "Yes" : overview.declinedForNow ? "Taking time" : "Not yet"}
            hint={
              overview.accepted && overview.acceptedAt
                ? formatDhakaTimestamp(overview.acceptedAt)
                : overview.thinkingAt
                  ? `She pressed "let me think" ${formatDhakaTimestamp(overview.thinkingAt)}`
                  : "Waiting for her answer"
            }
            tone={overview.accepted ? "good" : "neutral"}
          />
          <StatCard
            icon={CalendarDays}
            label="Date plan saved"
            value={overview.submitted ? "Yes" : "Not yet"}
            hint={
              overview.submitted && overview.submittedAt
                ? formatDhakaTimestamp(overview.submittedAt)
                : "Nothing submitted yet"
            }
            tone={overview.submitted ? "good" : "neutral"}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-cream/70 px-5 py-4">
          <span className="text-[0.62rem] uppercase tracking-[0.26em] text-muted/85">
            Current status
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-[0.7rem] font-medium ${
              statusStyles[(overview.status as ResponseStatus) ?? "new"] ?? statusStyles.new
            }`}
          >
            {overview.submitted
              ? STATUS_LABELS[(overview.status as ResponseStatus) ?? "new"]
              : overview.accepted
                ? "Accepted, still choosing"
                : overview.unlocked
                  ? "Reading the letter"
                  : "Waiting at the lock"}
          </span>
          <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.6} />
              {overview.letterOpened ? "Letter opened" : "Letter not opened yet"}
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.6} />
              {overview.bouquetOpenedAt ? "Bouquet seen" : "Bouquet not seen yet"}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquareHeart className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.6} />
              {overview.finalOpenedAt ? "Final message read" : "Final message not opened yet"}
            </span>
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------ RESPONSE */}
      <section aria-labelledby="response-heading" className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="response-heading" className="font-display text-2xl text-burgundy">
            Samee&apos;s response
          </h2>
          {latest && (
            <span
              className={`rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] ${
                statusStyles[latest.status as ResponseStatus] ?? statusStyles.new
              }`}
            >
              {STATUS_LABELS[latest.status as ResponseStatus] ?? latest.status}
            </span>
          )}
        </div>

        {latest ? (
          <article className="overflow-hidden rounded-2xl border border-gold/30 bg-cream/80 shadow-[var(--shadow-soft)]">
            <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-gold/20 p-5 sm:p-7 md:border-b-0 md:border-r">
                <dl className="space-y-5">
                  <Detail icon={CalendarDays} label="The day" value={formatDhakaDate(latest.date)} />
                  <Detail
                    icon={Clock}
                    label="The time"
                    value={`${latest.time}${latest.timeIsCustom ? " (her own time)" : ""}`}
                    hint="Asia/Dhaka"
                  />
                  <Detail
                    icon={MapPin}
                    label="Our place"
                    value={
                      latest.placeCustom
                        ? `${latest.placeLabel} — ${latest.placeCustom}`
                        : latest.placeLabel
                    }
                  />
                  <Detail
                    icon={Sparkles}
                    label="Activities"
                    value={
                      latest.activities
                        .map((activity) =>
                          activity.id === "other" && latest.activityCustom
                            ? `${activity.label} — ${latest.activityCustom}`
                            : activity.label,
                        )
                        .join(" · ") || "—"
                    }
                  />
                  <Detail
                    icon={MessageSquareHeart}
                    label="Her message"
                    value={latest.message || "She did not write anything this time."}
                    quote={Boolean(latest.message)}
                  />
                  <Detail
                    icon={CheckCircle2}
                    label="Acceptance"
                    value={
                      latest.acceptedAt
                        ? `Accepted the proposal on ${formatDhakaTimestamp(latest.acceptedAt)}`
                        : "No acceptance recorded"
                    }
                  />
                  <Detail
                    icon={Clock}
                    label="Submitted"
                    value={`${formatDhakaTimestamp(latest.submittedAt)} · version ${latest.version}`}
                  />
                </dl>
              </div>

              <div className="p-5 sm:p-7">
                <ResponseEditor
                  responseId={latest.id}
                  status={latest.status}
                  adminNotes={latest.adminNotes}
                  version={latest.version}
                />
              </div>
            </div>
          </article>
        ) : (
          <EmptyState
            title="Nothing saved from Samiya yet"
            body="As soon as she unlocks the letter and saves her little plan, every detail lands right here. Nothing on this page is invented."
          />
        )}
      </section>

      {/* ------------------------------------------------------- HISTORY */}
      <section aria-labelledby="history-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="history-heading" className="font-display text-2xl text-burgundy">
            Response history
          </h2>
          <span className="text-[0.7rem] uppercase tracking-[0.2em] text-muted/75">
            {responses.length} saved {responses.length === 1 ? "response" : "responses"}
          </span>
        </div>

        {previous.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gold/40 bg-cream/50 px-5 py-6 text-sm leading-relaxed text-muted">
            {latest
              ? "This is her first and only plan so far. If she changes her mind, the older version is kept here automatically."
              : "Version history will appear here if she ever changes her plan."}
          </p>
        ) : (
          <ol className="space-y-3">
            {previous.map((response) => (
              <li
                key={response.id}
                className="rounded-2xl border border-gold/25 bg-cream/60 px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className="font-medium text-ink">
                    {formatDhakaDate(response.date)}
                  </span>
                  <span className="text-muted">at {response.time}</span>
                  <span className="text-muted">· {response.placeLabel}</span>
                  <span className="ml-auto text-[0.7rem] uppercase tracking-[0.16em] text-muted/75">
                    v{response.version} · {formatDhakaTimestamp(response.submittedAt)}
                  </span>
                </div>
                <p className="mt-2 text-[0.82rem] text-muted">
                  {response.activities.map((activity) => activity.label).join(" · ") || "No activities"}
                </p>
                {response.history.length > 0 && (
                  <details className="mt-2 text-[0.8rem] text-muted">
                    <summary className="cursor-pointer select-none text-burgundy/80">
                      Earlier versions ({response.history.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5 border-l border-gold/40 pl-3">
                      {response.history.map((entry) => (
                        <li key={`${response.id}-${entry.version}`}>
                          v{entry.version} replaced {formatDhakaTimestamp(entry.replacedAt)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ol>
        )}

        {latest && (
          <p className="pt-1 text-[0.72rem] leading-relaxed text-muted/75">
            Every change Samiya makes updates this single plan and archives the previous snapshot,
            so refreshing or going back never creates duplicates.
          </p>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/25 pt-6 text-[0.72rem] text-muted/75">
        <p>Private dashboard · only visible to a signed-in Yousuf.</p>
        <Link href="/" className="underline decoration-gold/60 underline-offset-4 hover:text-burgundy">
          Open the experience
        </Link>
      </footer>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-gold/30 bg-cream/75 p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <span className="text-[0.62rem] uppercase tracking-[0.24em] text-muted/85">{label}</span>
        <Icon
          className={`h-4 w-4 ${tone === "good" ? "text-sage" : "text-burgundy/45"}`}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 font-display text-2xl text-burgundy">{value}</p>
      <p className="mt-1 text-[0.72rem] leading-snug text-muted/85">{hint}</p>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  hint,
  quote = false,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  hint?: string;
  quote?: boolean;
}) {
  return (
    <div className="flex gap-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-cream text-burgundy">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.6rem] uppercase tracking-[0.26em] text-muted/80">{label}</dt>
        <dd
          className={
            quote
              ? "mt-1 whitespace-pre-wrap font-serif text-[1.02rem] italic leading-relaxed text-burgundy/85"
              : "mt-0.5 text-[0.95rem] leading-relaxed text-ink/85"
          }
        >
          {value}
          {hint && <span className="ml-1.5 text-[0.7rem] text-muted/65">({hint})</span>}
        </dd>
      </div>
    </div>
  );
}
