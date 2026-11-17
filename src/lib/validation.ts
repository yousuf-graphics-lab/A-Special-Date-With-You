import { z } from "zod";
import {
  ACTIVITY_OPTIONS,
  PLACE_OPTIONS,
  TIME_SLOTS,
  formatTimeLabel,
  isIsoDate,
  timeToMinutes,
  todayInDhaka,
} from "./date-options";

const placeIds = PLACE_OPTIONS.map((option) => option.id);
const activityIds = ACTIVITY_OPTIONS.map((option) => option.id);

const trimmed = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length <= max, {
      message: `Please keep this under ${max} characters.`,
    });

export const planSchema = z
  .object({
    selectedDate: z
      .string()
      .refine(isIsoDate, { message: "Please pick a date from the calendar." })
      .refine((value) => value >= todayInDhaka(), {
        message: "That day has already passed. Pick a day that is still ahead of us.",
      }),
    timeMode: z.enum(["slot", "custom"]),
    timeSlot: z.string().optional().default(""),
    customTime: z.string().optional().default(""),
    placeId: z.string().min(1, { message: "Choose where you would like to go." }),
    placeCustom: trimmed(120).optional().default(""),
    activities: z
      .array(z.string())
      .min(1, { message: "Pick at least one thing you would like to do." })
      .max(activityIds.length),
    activityCustom: trimmed(160).optional().default(""),
    message: trimmed(1200).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (!placeIds.includes(value.placeId)) {
      ctx.addIssue({
        code: "custom",
        path: ["placeId"],
        message: "Choose one of the listed places, or pick the custom option.",
      });
    }

    const unknownActivity = value.activities.find((id) => !activityIds.includes(id));
    if (unknownActivity) {
      ctx.addIssue({
        code: "custom",
        path: ["activities"],
        message: "One of those activities is not on the list.",
      });
    }
    if (new Set(value.activities).size !== value.activities.length) {
      ctx.addIssue({
        code: "custom",
        path: ["activities"],
        message: "An activity was selected twice.",
      });
    }

    if (value.timeMode === "slot") {
      if (!TIME_SLOTS.includes(value.timeSlot as (typeof TIME_SLOTS)[number])) {
        ctx.addIssue({
          code: "custom",
          path: ["timeSlot"],
          message: "Pick one of the time slots, or choose a custom time.",
        });
      }
    } else {
      const minutes = timeToMinutes(value.customTime ?? "");
      if (minutes === null) {
        ctx.addIssue({
          code: "custom",
          path: ["customTime"],
          message: "Enter a time like 4:30 PM.",
        });
      } else if (minutes < 7 * 60 || minutes > 23 * 60 + 30) {
        ctx.addIssue({
          code: "custom",
          path: ["customTime"],
          message: "Let's keep it between 7:00 AM and 11:30 PM.",
        });
      }
    }

    if (value.placeId === "surprise" && !value.placeCustom?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["placeCustom"],
        message: "Tell me where, and I will be there.",
      });
    }

    if (value.activities.includes("other") && !value.activityCustom?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["activityCustom"],
        message: "What would you like us to do?",
      });
    }
  });

export type PlanInput = z.input<typeof planSchema>;
export type PlanPayload = z.output<typeof planSchema>;

export const loginSchema = z.object({
  username: z.string().min(1).max(80).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

export const unlockSchema = z.object({
  password: z.string().min(1).max(64),
});

export const responseUpdateSchema = z.object({
  status: z.enum(["new", "reviewed", "planning", "confirmed", "completed"]).optional(),
  adminNotes: z.string().max(4000).optional(),
  markReviewed: z.boolean().optional(),
});

/**
 * Turn a validated payload into the columns the table expects.
 * Free-text extras are only stored for the option they belong to, so a stray
 * value can never show up next to the wrong choice.
 */
export function toPlanColumns(payload: PlanPayload) {
  const isSlot = payload.timeMode === "slot";
  const customPlace = payload.placeId === "surprise" ? payload.placeCustom?.trim() : "";
  const customActivity = payload.activities.includes("other")
    ? payload.activityCustom?.trim()
    : "";

  return {
    selectedDate: payload.selectedDate,
    selectedTime: isSlot ? payload.timeSlot : formatTimeLabel(payload.customTime),
    timeIsCustom: !isSlot,
    locationLabel: payload.placeId,
    locationCustom: customPlace || null,
    activities: payload.activities,
    activityCustom: customActivity || null,
    message: payload.message?.trim() ? payload.message.trim() : null,
  };
}
