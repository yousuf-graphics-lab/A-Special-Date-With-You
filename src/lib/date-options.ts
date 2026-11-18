/**
 * Shared vocabulary for the date planner. Imported by both the client UI and
 * server-side validation so the two can never drift apart.
 */

export const TIME_ZONE = "Asia/Dhaka";

export const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export type PlaceOption = {
  id: string;
  label: string;
  blurb: string;
  icon: "coffee" | "dining" | "outdoor" | "garden" | "sunset" | "sparkle";
};

export const PLACE_OPTIONS: PlaceOption[] = [
  {
    id: "coffee",
    label: "A cozy coffee shop",
    blurb: "A corner table, two cups, and nowhere else to be.",
    icon: "coffee",
  },
  {
    id: "restaurant",
    label: "A beautiful restaurant",
    blurb: "Good food, soft light, and you across the table.",
    icon: "dining",
  },
  {
    id: "outdoor",
    label: "A peaceful outdoor place",
    blurb: "Somewhere quiet where the world slows down.",
    icon: "outdoor",
  },
  {
    id: "park",
    label: "A park or garden",
    blurb: "Green all around, and a long slow walk.",
    icon: "garden",
  },
  {
    id: "sunset",
    label: "A sunset view",
    blurb: "The sky doing its prettiest, just for us.",
    icon: "sunset",
  },
  {
    id: "surprise",
    label: "Somewhere special you choose",
    blurb: "Surprise me. I will happily follow you there.",
    icon: "sparkle",
  },
];

export type ActivityOption = {
  id: string;
  label: string;
  blurb: string;
  icon:
    | "coffee"
    | "dinner"
    | "walk"
    | "sunset"
    | "explore"
    | "gift"
    | "heart";
};

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    id: "coffee",
    label: "Coffee Together",
    blurb: "Two cups, slow sips, no hurry.",
    icon: "coffee",
  },
  {
    id: "dinner",
    label: "A Romantic Dinner",
    blurb: "Candlelight and conversations that last.",
    icon: "dinner",
  },
  {
    id: "walk",
    label: "A Peaceful Walk",
    blurb: "Hand in hand, taking the long way.",
    icon: "walk",
  },
  {
    id: "sunset",
    label: "Watching the Sunset",
    blurb: "Sitting quietly while the sky changes colour.",
    icon: "sunset",
  },
  {
    id: "explore",
    label: "Exploring Somewhere New",
    blurb: "A place neither of us has been before.",
    icon: "explore",
  },
  {
    id: "surprise",
    label: "A Surprise Planned by Yousuf",
    blurb: "Leave it to me. I have been thinking about it.",
    icon: "gift",
  },
  {
    id: "other",
    label: "Something Else",
    blurb: "You tell me, and I will make it happen.",
    icon: "heart",
  },
];

export const RESPONSE_STATUSES = [
  "new",
  "reviewed",
  "planning",
  "confirmed",
  "completed",
] as const;

export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];

export const STATUS_LABELS: Record<ResponseStatus, string> = {
  new: "New Response",
  reviewed: "Reviewed",
  planning: "Planning",
  confirmed: "Confirmed",
  completed: "Completed",
};

export const placeLabel = (id: string | null): string | null =>
  PLACE_OPTIONS.find((option) => option.id === id)?.label ?? (id || null);

export const activityLabel = (id: string): string =>
  ACTIVITY_OPTIONS.find((option) => option.id === id)?.label ?? id;

/** Convert "1:00 PM" / "13:00" / "09:30" into minutes after midnight. */
export function timeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  const twelve = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (twelve) {
    let hour = Number(twelve[1]) % 12;
    if (twelve[3].toLowerCase() === "pm") hour += 12;
    return hour * 60 + Number(twelve[2] ?? 0);
  }
  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minutes = Number(twentyFour[2]);
    if (hour > 23 || minutes > 59) return null;
    return hour * 60 + minutes;
  }
  return null;
}

/** "7:05 PM" from "19:05" and friends — used for the custom time display. */
export function formatTimeLabel(value: string): string {
  const minutes = timeToMinutes(value);
  if (minutes === null) return value;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** Today in Dhaka as YYYY-MM-DD, independent of the server's own timezone. */
export function todayInDhaka(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "Sunday, 23 November 2025" — Dhaka calendar day for a stored date. */
export function formatDhakaDate(isoDate: string, style: "long" | "short" = "long"): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(utcNoon);
}

export function formatDhakaTimestamp(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "—";
  return `${new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)} (Dhaka)`;
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
