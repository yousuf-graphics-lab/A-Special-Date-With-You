"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Clock,
  Coffee,
  Compass,
  Gift,
  Heart,
  Loader2,
  MapPin,
  MessageSquareHeart,
  Pencil,
  Soup,
  Sparkles,
  Sun,
  Trees,
  UtensilsCrossed,
  Footprints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DateCalendar } from "@/components/calendar";
import {
  ACTIVITY_OPTIONS,
  PLACE_OPTIONS,
  TIME_SLOTS,
  formatDhakaDate,
  formatTimeLabel,
  placeLabel,
} from "@/lib/date-options";
import { PLANNER } from "@/lib/content";
import type { PlanView } from "@/lib/plan";

export type PlanFormState = {
  date: string;
  timeMode: "slot" | "custom";
  timeSlot: string;
  customTime: string;
  placeId: string;
  placeCustom: string;
  activities: string[];
  activityCustom: string;
  message: string;
};

const ICONS: Record<string, LucideIcon> = {
  coffee: Coffee,
  dining: UtensilsCrossed,
  outdoor: Compass,
  garden: Trees,
  sunset: Sun,
  sparkle: Sparkles,
  dinner: Soup,
  walk: Footprints,
  explore: Compass,
  gift: Gift,
  heart: Heart,
};

const sectionMotion = (reduced: boolean, index: number) =>
  reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

export function PlannerScreen({
  value,
  onChange,
  onSaved,
  onBack,
}: {
  value: PlanFormState;
  onChange: (next: PlanFormState) => void;
  onSaved: (plan: PlanView) => void;
  onBack: () => void;
}) {
  const reduced = useReducedMotion();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [saved, setSaved] = useState<PlanView | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const update = <K extends keyof PlanFormState>(key: K, next: PlanFormState[K]) => {
    onChange({ ...value, [key]: next });
    if (errors[key]) setErrors(({ [key]: _removed, ...rest }) => rest);
    // Coming back to change something after saving: let her edit and save again.
    if (saved) setSaved(null);
  };

  const toggleActivity = (id: string) => {
    const next = value.activities.includes(id)
      ? value.activities.filter((item) => item !== id)
      : [...value.activities, id];
    update("activities", next);
  };

  const chosenTime = value.timeMode === "slot" ? value.timeSlot : value.customTime;
  const chosenPlace =
    value.placeId === "surprise"
      ? value.placeCustom.trim()
        ? `Somewhere you choose — ${value.placeCustom.trim()}`
        : "Somewhere you choose"
      : placeLabel(value.placeId) ?? "";

  const summary = useMemo(
    () => ({
      date: value.date ? formatDhakaDate(value.date) : "Not chosen yet",
      time: chosenTime ? formatTimeLabel(chosenTime) : "Not chosen yet",
      place: chosenPlace || "Not chosen yet",
      activities: value.activities.map(
        (id) => ACTIVITY_OPTIONS.find((option) => option.id === id)?.label ?? id,
      ),
      message: value.message.trim(),
    }),
    [value.date, chosenTime, chosenPlace, value.activities, value.message],
  );

  const pending =
    Boolean(value.date) &&
    Boolean(chosenTime) &&
    Boolean(value.placeId) &&
    value.activities.length > 0;

  async function save() {
    setSaving(true);
    setServerError(null);
    setErrors({});

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedDate: value.date,
          timeMode: value.timeMode,
          timeSlot: value.timeSlot,
          customTime: value.customTime,
          placeId: value.placeId,
          placeCustom: value.placeCustom,
          activities: value.activities,
          activityCustom: value.activities.includes("other") ? value.activityCustom : "",
          message: value.message,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        plan?: PlanView;
        error?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !data.ok || !data.plan) {
        setErrors(data.fieldErrors ?? {});
        setServerError(data.error ?? "That didn't save. Please give it one more try.");
        setReviewing(false);
        return;
      }

      setSaved(data.plan);
      setSavedNote(data.message ?? null);
      setReviewing(false);
      window.setTimeout(() => onSaved(data.plan!), reduced ? 200 : 1400);
    } catch {
      setServerError("I could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <section className="flex min-h-dvh items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-burgundy text-ivory"
          >
            <Check className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
          </motion.span>
          <h2 className="font-display text-3xl text-burgundy">{PLANNER.success}</h2>
          {savedNote && <p className="mt-2 text-sm text-burgundy/80">{savedNote}</p>}
          <p className="mt-1 text-sm text-muted">There is one more little thing waiting for you…</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-3xl px-4 py-14 sm:px-8 sm:py-20">
      <div className="text-center">
        <p className="eyebrow mb-4">Just us, just your way</p>
        <h2 className="font-display text-[2.1rem] leading-[1.1] tracking-tight text-burgundy sm:text-[2.9rem]">
          {PLANNER.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-[0.98rem] leading-relaxed text-muted">
          {PLANNER.subtitle}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-[0.7rem] uppercase tracking-[0.28em] text-muted/70 underline decoration-gold/50 underline-offset-4 transition hover:text-burgundy"
        >
          Back to the question
        </button>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        className="mt-10 space-y-6 sm:mt-14 sm:space-y-8"
      >
        {/* ---------------------------------------------------------- DATE */}
        <motion.div variants={sectionMotion(!!reduced, 0)}>
          <SectionHeading
            icon={CalendarDays}
            step="01"
            title={PLANNER.sections.date}
            hint={PLANNER.sections.dateHint}
          />
          <DateCalendar
            value={value.date}
            onChange={(date) => update("date", date)}
          />
          {value.date && (
            <p className="mt-2.5 text-sm text-burgundy/80">
              <span className="text-muted">You picked: </span>
              {formatDhakaDate(value.date)}
            </p>
          )}
          {errors.selectedDate && <FieldError>{errors.selectedDate}</FieldError>}
        </motion.div>

        {/* ---------------------------------------------------------- TIME */}
        <motion.div variants={sectionMotion(!!reduced, 1)}>
          <SectionHeading
            icon={Clock}
            step="02"
            title={PLANNER.sections.time}
            hint={PLANNER.sections.timeHint}
          />
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map((slot) => {
              const active = value.timeMode === "slot" && value.timeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onChange({ ...value, timeMode: "slot", timeSlot: slot });
                    setErrors(({ timeSlot: _a, customTime: _b, ...rest }) => rest);
                  }}
                  className={[
                    "rounded-full border px-4 py-2.5 text-sm transition-all duration-300",
                    active
                      ? "border-transparent bg-burgundy text-ivory shadow-[0_10px_24px_-16px_rgba(88,34,47,0.95)]"
                      : "border-burgundy/15 bg-cream/70 text-ink/75 hover:border-burgundy/35 hover:bg-blush/40",
                  ].join(" ")}
                >
                  {slot}
                </button>
              );
            })}

            <button
              type="button"
              aria-pressed={value.timeMode === "custom"}
              onClick={() => onChange({ ...value, timeMode: "custom" })}
              className={[
                "rounded-full border px-4 py-2.5 text-sm transition-all duration-300",
                value.timeMode === "custom"
                  ? "border-transparent bg-burgundy text-ivory"
                  : "border-dashed border-burgundy/25 bg-cream/60 text-ink/70 hover:border-burgundy/45",
              ].join(" ")}
            >
              {PLANNER.customTime}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {value.timeMode === "custom" && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label htmlFor="custom-time" className="text-sm text-muted">
                    Any time you like
                  </label>
                  <input
                    id="custom-time"
                    type="time"
                    value={toInputTime(value.customTime)}
                    onChange={(event) => update("customTime", fromInputTime(event.target.value))}
                    className={`field w-auto ${errors.customTime ? "field-error" : ""}`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {errors.timeSlot && <FieldError>{errors.timeSlot}</FieldError>}
          {errors.customTime && <FieldError>{errors.customTime}</FieldError>}
        </motion.div>

        {/* --------------------------------------------------------- PLACE */}
        <motion.div variants={sectionMotion(!!reduced, 2)}>
          <SectionHeading
            icon={MapPin}
            step="03"
            title={PLANNER.sections.place}
            hint={PLANNER.sections.placeHint}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {PLACE_OPTIONS.map((option) => {
              const active = value.placeId === option.id;
              const Icon = ICONS[option.icon] ?? MapPin;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update("placeId", option.id)}
                  className={[
                    "group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300",
                    active
                      ? "border-burgundy/45 bg-blush/45 shadow-[0_12px_28px_-22px_rgba(88,34,47,0.9)]"
                      : "border-gold/25 bg-cream/70 hover:border-burgundy/25 hover:bg-blush/25",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
                      active ? "bg-burgundy text-ivory" : "bg-blush/60 text-burgundy",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-medium text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-[0.8rem] leading-snug text-muted">
                      {option.blurb}
                    </span>
                  </span>
                  {active && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-burgundy" strokeWidth={2.4} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {value.placeId === "surprise" && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <label htmlFor="custom-place" className="mb-1.5 block text-sm text-muted">
                    {PLANNER.customPlace}
                  </label>
                  <input
                    id="custom-place"
                    type="text"
                    value={value.placeCustom}
                    onChange={(event) => update("placeCustom", event.target.value.slice(0, 120))}
                    placeholder={PLANNER.customPlacePlaceholder}
                    className={`field ${errors.placeCustom ? "field-error" : ""}`}
                  />
                  {errors.placeCustom && <FieldError>{errors.placeCustom}</FieldError>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {errors.placeId && <FieldError>{errors.placeId}</FieldError>}
        </motion.div>

        {/* ------------------------------------------------------ ACTIVITY */}
        <motion.div variants={sectionMotion(!!reduced, 3)}>
          <SectionHeading
            icon={Heart}
            step="04"
            title={PLANNER.sections.activity}
            hint={PLANNER.sections.activityHint}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACTIVITY_OPTIONS.map((option) => {
              const active = value.activities.includes(option.id);
              const Icon = ICONS[option.icon] ?? Heart;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleActivity(option.id)}
                  className={[
                    "group relative flex h-full flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all duration-300",
                    active
                      ? "border-burgundy/45 bg-blush/45 shadow-[0_12px_28px_-22px_rgba(88,34,47,0.9)]"
                      : "border-gold/25 bg-cream/70 hover:-translate-y-0.5 hover:border-burgundy/25 hover:bg-blush/25",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full transition",
                      active
                        ? "bg-burgundy text-ivory"
                        : "bg-gradient-to-br from-blush/80 to-gold/25 text-burgundy",
                    ].join(" ")}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="text-[0.9rem] font-medium leading-tight text-ink">{option.label}</span>
                  <span className="text-[0.74rem] leading-snug text-muted">{option.blurb}</span>
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition",
                      active ? "border-burgundy bg-burgundy text-ivory" : "border-gold/40 text-transparent",
                    ].join(" ")}
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence initial={false}>
            {value.activities.includes("other") && (
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <label htmlFor="custom-activity" className="mb-1.5 block text-sm text-muted">
                    {PLANNER.customActivity}
                  </label>
                  <input
                    id="custom-activity"
                    type="text"
                    value={value.activityCustom}
                    onChange={(event) => update("activityCustom", event.target.value.slice(0, 160))}
                    className={`field ${errors.activityCustom ? "field-error" : ""}`}
                  />
                  {errors.activityCustom && <FieldError>{errors.activityCustom}</FieldError>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {errors.activities && <FieldError>{errors.activities}</FieldError>}
        </motion.div>

        {/* ------------------------------------------------------- MESSAGE */}
        <motion.div variants={sectionMotion(!!reduced, 4)}>
          <SectionHeading
            icon={MessageSquareHeart}
            step="05"
            title={PLANNER.sections.message}
            hint={PLANNER.sections.messageOptional}
          />
          <label htmlFor="her-message" className="sr-only">
            {PLANNER.sections.messageLabel}
          </label>
          <p className="-mt-1 mb-2 text-sm text-muted">{PLANNER.sections.messageLabel}</p>
          <textarea
            id="her-message"
            rows={4}
            maxLength={1200}
            value={value.message}
            onChange={(event) => update("message", event.target.value)}
            placeholder={PLANNER.sections.messagePlaceholder}
            className="field resize-y leading-relaxed"
          />
          <p className="mt-1.5 text-right text-[0.68rem] text-muted/70">
            {value.message.length}/1200
          </p>
          {errors.message && <FieldError>{errors.message}</FieldError>}
        </motion.div>

        {/* -------------------------------------------------------- REVIEW */}
        <motion.div variants={sectionMotion(!!reduced, 5)}>
          <SectionHeading
            icon={Sparkles}
            step="06"
            title={PLANNER.sections.review}
            hint={PLANNER.sections.reviewHint}
          />

          <div className="paper rounded-2xl p-5 sm:p-7">
            {!pending && (
              <p className="mb-5 rounded-xl border border-gold/40 bg-blush/25 px-4 py-3 text-[0.82rem] leading-relaxed text-burgundy/80">
                Pick a day, a time, a place and at least one activity, then your plan is ready to save.
                Everything you choose appears here as you go.
              </p>
            )}

            <dl className="space-y-4 text-sm">
              <SummaryRow label="Date" value={summary.date} />
              <SummaryRow label="Time" value={summary.time} />
              <SummaryRow label="Place" value={summary.place} />
              <SummaryRow
                label="Activities"
                value={
                  summary.activities.length > 0
                    ? summary.activities.join(" · ") +
                      (value.activityCustom.trim() && value.activities.includes("other")
                        ? ` — ${value.activityCustom.trim()}`
                        : "")
                    : "Not chosen yet"
                }
              />
              <SummaryRow
                label="Your message"
                value={summary.message || "You have not written anything yet (that is perfectly fine)."}
                muted={!summary.message}
              />
            </dl>

            {serverError && (
              <p role="alert" className="mt-5 rounded-xl border border-[#a33a4a]/30 bg-[#fbe9ec] px-4 py-3 text-sm text-[#8f3040]">
                {serverError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
              <button
                type="button"
                onClick={() => setReviewing(true)}
                disabled={saving}
                className="btn-primary w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {PLANNER.saving}
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                    {PLANNER.save}
                  </>
                )}
              </button>
              <p className="text-center text-[0.72rem] text-muted/75 sm:text-left">
                Nothing is public. Only I will see this, my love.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ------------------------------------------------ CONFIRM DIALOG */}
      <AnimatePresence>
        {reviewing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-burgundy-deep/45 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(event) => {
              if (event.target === event.currentTarget && !saving) setReviewing(false);
            }}
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="paper w-full max-w-md rounded-2xl p-6 sm:p-7"
            >
              <h3 id="confirm-title" className="font-display text-xl text-burgundy">
                Shall I save our little plan?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You can still change anything afterwards. This is just so we both know it is right.
              </p>

              <dl className="mt-5 space-y-3 border-y border-gold/25 py-4 text-sm">
                <SummaryRow label="Date" value={summary.date} compact />
                <SummaryRow label="Time" value={summary.time} compact />
                <SummaryRow label="Place" value={summary.place} compact />
                <SummaryRow
                  label="Activities"
                  value={summary.activities.join(" · ") || "Not chosen yet"}
                  compact
                />
              </dl>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || !pending}
                  className="btn-primary w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      {PLANNER.saving}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                      Yes, save it
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewing(false)}
                  disabled={saving}
                  className="btn-ghost w-full sm:w-auto"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  {PLANNER.edit}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  step,
  title,
  hint,
}: {
  icon: LucideIcon;
  step: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-3.5 flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-cream/80 text-burgundy">
        <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">Step {step}</p>
        <h3 className="font-display text-[1.25rem] text-burgundy sm:text-[1.4rem]">{title}</h3>
        <p className="mt-0.5 text-[0.8rem] leading-snug text-muted">{hint}</p>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-2 flex items-start gap-1.5 text-[0.8rem] text-[#a33a4a]">
      <span aria-hidden="true">·</span>
      {children}
    </p>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
  compact = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex gap-3" : "flex flex-col gap-1 sm:flex-row sm:gap-4"}>
      <dt className="shrink-0 text-[0.68rem] uppercase tracking-[0.2em] text-muted/85 sm:w-32 sm:pt-1">
        {label}
      </dt>
      <dd className={`text-ink/85 ${muted ? "italic text-muted/80" : ""} ${compact ? "text-right flex-1" : "flex-1 leading-relaxed"}`}>
        {value}
      </dd>
    </div>
  );
}

/** "19:05" -> "19:05" for <input type="time">; tolerant of "7:05 PM". */
function toInputTime(value: string): string {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (!match) return "";
  let hour = Number(match[1]) % 12;
  if (match[3].toLowerCase() === "pm") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2] ?? "00"}`;
}

function fromInputTime(value: string): string {
  return value;
}
