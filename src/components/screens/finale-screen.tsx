"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  MessageSquareHeart,
  Pencil,
  Sparkles,
} from "lucide-react";
import { BlossomRule, CornerFlourish, WaxSeal } from "@/components/ornaments";
import {
  ACTIVITY_OPTIONS,
  formatDhakaDate,
  formatTimeLabel,
  placeLabel,
} from "@/lib/date-options";
import { FINALE } from "@/lib/content";
import type { PlanView } from "@/lib/plan";
import type { PlanFormState } from "@/components/screens/planner-screen";

/**
 * Fall back to the in-memory form if the visitor refreshes on this screen and
 * the plan has not been rehydrated — the saved row is always the source of
 * truth when available.
 */
function buildView(plan: PlanView | null, form: PlanFormState) {
  if (plan) {
    return {
      date: plan.date,
      time: plan.time,
      place: plan.placeLabel,
      placeCustom: plan.placeCustom,
      activities: plan.activities.map((activity) =>
        activity.id === "other" && plan.activityCustom
          ? `${activity.label} — ${plan.activityCustom}`
          : activity.label,
      ),
      message: plan.message,
    };
  }

  if (!form.date) return null;

  const time = form.timeMode === "slot" ? form.timeSlot : form.customTime;
  return {
    date: form.date,
    time,
    place: placeLabel(form.placeId) ?? "",
    placeCustom: form.placeCustom || null,
    activities: form.activities.map((id) => {
      const option = ACTIVITY_OPTIONS.find((item) => item.id === id);
      if (id === "other" && form.activityCustom) return `${option?.label ?? id} — ${form.activityCustom}`;
      return option?.label ?? id;
    }),
    message: form.message || null,
  };
}

export function FinaleScreen({
  plan,
  form,
  onReplay,
  onEdit,
}: {
  plan: PlanView | null;
  form: PlanFormState;
  /** Back to the letter, to read it again. */
  onReplay: () => void;
  /** Back to the planner with her answers still filled in. */
  onEdit: () => void;
}) {
  const reduced = useReducedMotion();
  const view = buildView(plan, form);

  /**
   * This used to be `whileInView`, which made the whole screen depend on an
   * IntersectionObserver firing. If it never does — and the page wrapper's
   * `overflow-hidden` is enough to make it unreliable — every element stays at
   * `opacity: 0` forever: the finale "never opens" while the DOM is all there.
   * This screen had no `animate` fallback at all, unlike every other screen,
   * which is why only this one went blank.
   *
   * `animate` runs on mount and always completes. The finale is entered by a
   * deliberate action, so there is nothing to gain from waiting for a scroll.
   */
  const appear = (delay: number) =>
    reduced
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative mx-auto w-full max-w-2xl px-5 pb-28 pt-16 sm:px-8 sm:pt-24">
      <motion.div {...appear(0)} className="text-center">
        <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 bg-cream/80 text-burgundy">
          <Heart className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <h2 className="font-display text-[2.3rem] leading-[1.08] tracking-tight text-burgundy sm:text-[3.1rem]">
          {FINALE.heading}
        </h2>
        <BlossomRule className="mt-7" />
      </motion.div>

      <motion.article
        {...appear(0.15)}
        className="paper relative mt-10 rounded-[18px] px-6 py-10 sm:rounded-[22px] sm:px-12 sm:py-14"
      >
        <CornerFlourish className="pointer-events-none absolute right-3 top-3 h-14 w-14 text-gold/55 sm:h-20 sm:w-20" />
        <CornerFlourish className="pointer-events-none absolute bottom-3 left-3 h-14 w-14 rotate-180 text-gold/55 sm:h-20 sm:w-20" />

        <div className="font-serif text-[1.08rem] leading-[1.95] text-ink/88 sm:text-[1.18rem] sm:leading-[2]">
          <p className="mb-5 font-display text-[1.28rem] italic text-burgundy sm:text-[1.4rem]">
            {FINALE.greeting}
          </p>
          {FINALE.paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
          <p className="mt-7 text-[1rem] italic text-muted">{FINALE.closing}</p>
          <p className="mt-3 text-[1rem] text-ink/85">{FINALE.signoff}</p>
          <p className="mt-1 font-script text-[2.6rem] leading-tight text-burgundy sm:text-[3.2rem]">
            {FINALE.signature}
          </p>
        </div>

        <div className="pointer-events-none absolute -bottom-6 right-6 sm:-bottom-7 sm:right-12">
          <WaxSeal initials="Y" />
        </div>
      </motion.article>

      {/* ------------------------------------------- OUR LITTLE DATE CARD */}
      <motion.div {...appear(0.2)} className="mt-14">
        <div className="relative overflow-hidden rounded-[20px] border border-gold/40 bg-gradient-to-b from-cream via-ivory to-blush/35 p-[1px] shadow-[var(--shadow-letter)]">
          <div className="rounded-[19px] px-6 py-8 sm:px-10 sm:py-10">
            <div className="text-center">
              <p className="eyebrow">Saved with love</p>
              <h3 className="mt-2 font-display text-2xl uppercase tracking-[0.18em] text-burgundy sm:text-[1.8rem]">
                {FINALE.cardTitle}
              </h3>
              <div className="gold-rule mx-auto mt-4 w-32" />
            </div>

            {view ? (
              <>
              <dl className="mt-7 space-y-5">
                <PlanRow icon={CalendarDays} label="The day" value={formatDhakaDate(view.date)} />
                <PlanRow icon={Clock} label="The time" value={formatTimeLabel(view.time)} hint="Bangladesh time" />
                <PlanRow
                  icon={MapPin}
                  label="Our place"
                  value={view.placeCustom ? `${view.place} — ${view.placeCustom}` : view.place}
                />
                <PlanRow
                  icon={Sparkles}
                  label="What we'll do"
                  value={view.activities.length > 0 ? view.activities.join(" · ") : "Still to decide"}
                />
                {view.message && (
                  <PlanRow icon={MessageSquareHeart} label="Your words" value={view.message} quote />
                )}
              </dl>
              <button
                type="button"
                onClick={onEdit}
                className="mt-7 inline-flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.22em] text-burgundy/75 underline decoration-gold/60 underline-offset-4 transition hover:text-burgundy"
              >
                <Pencil className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
                Change something
              </button>
              </>
            ) : (
              <div className="mt-7 rounded-xl border border-dashed border-gold/50 bg-cream/60 px-5 py-6 text-center">
                <p className="text-sm leading-relaxed text-muted">
                  Our plan is not filled in yet, my love. Whenever you are ready, go back and choose a
                  day that feels right.
                </p>
                <button type="button" onClick={onReplay} className="btn-ghost mt-4">
                  Choose our day
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.footer {...appear(0.1)} className="mt-12 text-center">
        <p className="font-script text-2xl text-burgundy/70 sm:text-3xl">
          Samee &amp; Yousuf
        </p>
        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.28em] text-muted/70">
          {FINALE.footer}
        </p>
      </motion.footer>
    </section>
  );
}

function PlanRow({
  icon: Icon,
  label,
  value,
  hint,
  quote = false,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint?: string;
  quote?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-cream/80 text-burgundy">
        <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[0.62rem] uppercase tracking-[0.26em] text-muted/80">{label}</dt>
        <dd
          className={
            quote
              ? "mt-1 whitespace-pre-wrap font-serif text-[1.05rem] italic leading-relaxed text-burgundy/85"
              : "mt-0.5 text-[1rem] leading-relaxed text-ink/85"
          }
        >
          {value}
          {hint && <span className="ml-1.5 text-[0.72rem] text-muted/70">({hint})</span>}
        </dd>
      </div>
    </div>
  );
}
