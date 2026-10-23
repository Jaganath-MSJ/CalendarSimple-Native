/**
 * @file The first and last visible day of each view (TDD §7.2).
 */
import { getDayOfWeek, type DateType } from "../utils/date";
import type { ECalendarViewType, VisibleRange } from "../types";
import { TIME_CONSTANTS } from "../constants";
import { buildMonthMatrix } from "./monthMatrix";
import { getVisibleDays } from "./visibleDays";

/** Options for `getVisibleRange`. */
export interface VisibleRangeOptions {
  weekStartsOn: number;
  weekEndsOn: number;
  customDays?: number;
  scheduleDays: number;
  scheduleExtraDays: number;
}

/**
 * Returns the visible days of `view` around `selectedDate`, both ends inclusive.
 * Month spans the first to the last grid cell (adjacent-month cells included);
 * Schedule spans `scheduleDays + scheduleExtraDays` days from `selectedDate`.
 */
export function getVisibleRange(
  view: ECalendarViewType,
  selectedDate: DateType,
  opts: VisibleRangeOptions,
): VisibleRange {
  const { DAYS_IN_WEEK } = TIME_CONSTANTS;
  const day = selectedDate.startOf("day");

  if (view === "month") {
    const first = day.startOf("month");
    const offset =
      (getDayOfWeek(first) - opts.weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK;
    const rows = buildMonthMatrix(day, opts.weekStartsOn).length;
    const length =
      ((opts.weekEndsOn - opts.weekStartsOn + DAYS_IN_WEEK) % DAYS_IN_WEEK) + 1;
    const start = first.minus({ days: offset });
    const end = start.plus({ days: (rows - 1) * DAYS_IN_WEEK + length - 1 });
    return { start, end };
  }

  if (view === "schedule") {
    const total = opts.scheduleDays + opts.scheduleExtraDays;
    return { start: day, end: day.plus({ days: Math.max(total, 1) - 1 }) };
  }

  const days = getVisibleDays(view, day, opts);
  return { start: days[0] ?? day, end: days[days.length - 1] ?? day };
}
