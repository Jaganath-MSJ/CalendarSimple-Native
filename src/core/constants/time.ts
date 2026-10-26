/**
 * @file Time unit and date format constants.
 */

/** Common time unit values used in duration and overlap calculations. */
export const TIME_CONSTANTS = {
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
  DAYS_IN_WEEK: 7,
  MS_PER_MINUTE: 60_000,
  MS_PER_HOUR: 3_600_000,
} as const;

/** Luxon format strings used throughout the calendar for date and time display. */
export const DATE_FORMATS = {
  DATE: "yyyy-MM-dd",
  TIME: "HH:mm",
  TIME_12H: "hh:mm a",
  HOUR_12H: "hh a",
  MONTH_YEAR: "MMMM yyyy",
  DAY_NUMBER: "d",
  MONTH_DAY_YEAR: "MMMM d, yyyy",
  SHORT_MONTH_YEAR: "MMM yyyy",
  SHORT_MONTH: "MMM",
  SHORT_DAY: "EEE",
  DAY_DATE_SHORT_MONTH: "EEE, d MMM",
} as const;
