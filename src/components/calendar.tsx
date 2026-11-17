"use client";

import { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { todayInDhaka } from "@/lib/date-options";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (value: number) => String(value).padStart(2, "0");
const toIso = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

/** Days in a month, computed in UTC so the local timezone can never shift it. */
function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Monday-first weekday index for the first of the month. */
function firstWeekday(year: number, month: number) {
  const day = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return (day + 6) % 7;
}

export function DateCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  /** YYYY-MM-DD in Dhaka, defaults to today in Dhaka. */
  minDate?: string;
  /** How many months ahead are selectable. */
  maxDate?: string;
}) {
  const reduced = useReducedMotion();
  const labelId = useId();
  const today = useMemo(() => todayInDhaka(), []);
  const min = minDate ?? today;
  const max = maxDate ?? addMonthsIso(min, 18);

  const initial = value && value >= min ? value : min;
  const [view, setView] = useState(() => {
    const [year, month] = initial.split("-").map(Number);
    return { year: year!, month: month! - 1 };
  });

  const todayParts = today.split("-").map(Number);
  const canGoBack =
    view.year > todayParts[0]! ||
    (view.year === todayParts[0] && view.month > todayParts[1]! - 1);

  const grid = useMemo(() => {
    const total = daysInMonth(view.year, view.month);
    const lead = firstWeekday(view.year, view.month);
    const cells: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= total; day += 1) cells.push(toIso(view.year, view.month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  function move(delta: number) {
    setView((current) => {
      const next = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  const selectedDay = value ? Number(value.split("-")[2]) : null;
  const selectedMonth = value ? Number(value.split("-")[1]) - 1 : null;
  const selectedYear = value ? Number(value.split("-")[0]) : null;
  const selectedInView =
    selectedYear === view.year && selectedMonth === view.month ? selectedDay : null;

  return (
    <div className="rounded-2xl border border-gold/30 bg-cream/70 p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/15 text-burgundy transition hover:bg-blush/50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <p id={labelId} aria-live="polite" className="font-display text-lg text-burgundy">
          {MONTHS[view.month]} {view.year}
        </p>

        <button
          type="button"
          onClick={() => move(1)}
          disabled={monthIsAfter(view, max)}
          aria-label="Next month"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-burgundy/15 text-burgundy transition hover:bg-blush/50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-labelledby={labelId}>
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="pb-1.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted/80"
          >
            {day.slice(0, 1)}
            <span className="hidden sm:inline">{day.slice(1)}</span>
          </div>
        ))}

        {grid.map((iso, index) => {
          if (!iso) return <div key={`empty-${index}`} role="gridcell" aria-hidden="true" />;

          const day = Number(iso.split("-")[2]);
          const isPast = iso < min;
          const isTooFar = iso > max;
          const disabled = isPast || isTooFar;
          const isSelected = iso === value;
          const isToday = iso === today;
          const isWeekend = index % 7 >= 5;

          return (
            <div key={iso} role="gridcell" className="flex justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(iso)}
                aria-pressed={isSelected}
                aria-label={formatLong(iso)}
                className={[
                  "relative flex h-10 w-full items-center justify-center rounded-xl text-sm transition-all duration-300 sm:h-11",
                  disabled
                    ? "cursor-not-allowed text-ink/20"
                    : isSelected
                      ? "text-ivory"
                      : isWeekend
                        ? "text-burgundy/70 hover:bg-blush/60"
                        : "text-ink/80 hover:bg-blush/60",
                ].join(" ")}
              >
                {isSelected && (
                  <motion.span
                    layoutId="calendar-selection"
                    className="absolute inset-0.5 rounded-xl bg-gradient-to-br from-[#83394e] to-[#5c2434] shadow-[0_8px_18px_-10px_rgba(88,34,47,0.9)]"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 32 }
                    }
                  />
                )}
                <span className="relative z-10">{day}</span>
                {isToday && !isSelected && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-gold" aria-hidden="true" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[0.68rem] text-muted/80">
        <span className="h-1 w-1 rounded-full bg-gold" aria-hidden="true" />
        Dates shown in Bangladesh time (Asia/Dhaka).
      </p>
    </div>
  );
}

function addMonthsIso(iso: string, months: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1 + months, day!));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function monthIsAfter(view: { year: number; month: number }, maxIso: string) {
  const [year, month] = maxIso.split("-").map(Number);
  return view.year > year! || (view.year === year && view.month >= month! - 1);
}

function formatLong(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month! - 1]} ${year}`;
}
