/**
 * @file The days a time-grid view (Week, Day, Custom Days) shows.
 */
import { getDayOfWeek, type DateType } from "../utils/date";
import { TIME_CONSTANTS } from "../constants";

/** Options for `getVisibleDays`. */
export interface VisibleDaysOptions {
  weekStartsOn: number;
  weekEndsOn: number;
  customDays?: number;
}

/**
 * Returns the visible days at start of day.
 * - `week`: from the day aligned to `weekStartsOn` through `weekEndsOn`.
 * - `day`: `[selectedDate]`.
 * - `customDays`: `customDays` (default 3) days from `selectedDate`.
 */
export function getVisibleDays(
  view: "week" | "day" | "customDays",
  selectedDate: DateType,
  { weekStartsOn, weekEndsOn, customDays }: VisibleDaysOptions,
): DateType[] {
  const { DAYS_IN_WEEK } = TIME_CONSTANTS;
  const day = selectedDate.startOf("day");
  if (view === "day") return [day];
  if (view === "customDays") {
    return Array.from({ length: customDays ?? 3 }, (_, i) =>
      day.plus({ days: i }),
    );
  }
  const back = (getDayOfWeek(day) - weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  const start = day.minus({ days: back });
  const length =
    ((weekEndsOn - weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK) + 1;
  return Array.from({ length }, (_, i) => start.plus({ days: i }));
}
