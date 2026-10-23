/**
 * @file Calendar view enums and small shared value types.
 */

/** Color palette modes accepted by `CalendarProps.colorScheme`. */
export type ColorScheme = "light" | "dark" | "auto";

/** Day of the week index: 0 = Sunday … 6 = Saturday. */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Layout direction. */
export type Direction = "ltr" | "rtl";

/**
 * Available calendar view modes.
 * Use as values for the `view` prop or `onViewChange` callback.
 */
export const ECalendarViewType = {
  month: "month",
  week: "week",
  day: "day",
  schedule: "schedule",
  customDays: "customDays",
} as const;

export type ECalendarViewType =
  (typeof ECalendarViewType)[keyof typeof ECalendarViewType];

/**
 * Controls how much of the day is shown in the time grid.
 * `full` shows all 24 hours; `half` shows 12 hours (combined with `minHour`/`maxHour`).
 */
export const EDayType = {
  full: "full",
  half: "half",
} as const;

export type EDayType = (typeof EDayType)[keyof typeof EDayType];

/**
 * A month entry used in the month picker.
 */
export interface MonthListType {
  /** Localized month name (e.g. "January"). */
  label: string;
  /** 0-based month number (0 = January … 11 = December). */
  value: number;
}
