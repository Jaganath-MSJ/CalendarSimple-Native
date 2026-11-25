/**
 * @file The first and last visible day of each view (TDD §7.2).
 */
import { dateFn, getDayOfWeek, type DateType } from "../utils/date";
import { getLastEventDay } from "../utils/common";
import type {
  BaseCalendarEvent,
  ECalendarViewType,
  VisibleRange,
} from "../types";
import { TIME_CONSTANTS } from "../constants";
import { buildMonthMatrix } from "./monthMatrix";
import { getVisibleDays } from "./visibleDays";
import { getScheduleExpansionWindow } from "../recurrence/expand";

/** Options for `getVisibleRange`. */
export interface VisibleRangeOptions {
  weekStartsOn: number;
  weekEndsOn: number;
  customDays?: number;
  /** Used by Schedule, which lists every event. */
  events?: readonly BaseCalendarEvent[];
}

/**
 * Returns the visible days of `view` around `selectedDate`, both ends inclusive.
 * Month spans the first to the last grid cell (adjacent-month cells included);
 * Schedule spans all events: the first one's start day to the last one's last
 * day (no events: the selected day), as calendar-simple.
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
    const events = opts.events ?? [];
    if (events.length === 0) return { start: day, end: day };
    let start = dateFn(events[0]!.startDate).startOf("day");
    let end = getLastEventDay(events[0]!);
    for (const event of events) {
      const s = dateFn(event.startDate).startOf("day");
      const e = getLastEventDay(event);
      if (s < start) start = s;
      if (e > end) end = e;
    }
    return { start, end };
  }

  const days = getVisibleDays(view, day, opts);
  return { start: days[0] ?? day, end: days[days.length - 1] ?? day };
}

/**
 * The range Schedule reports through `onDateRangeChange`: the span of the
 * events joined with the window around `selectedDate` (two months before to
 * twelve after, whole quarters; `getScheduleExpansionWindow`). An app that
 * loads events for the reported range therefore gets a useful range even
 * before it has any events.
 */
export function getScheduleLoadRange(
  selectedDate: DateType,
  events: readonly BaseCalendarEvent[],
): VisibleRange {
  const expansion = getScheduleExpansionWindow(selectedDate);
  // Day starts, like every other range.
  const start = expansion.start.startOf("day");
  const end = expansion.end.startOf("day");
  if (events.length === 0) return { start, end };
  const span = getVisibleRange("schedule", selectedDate, {
    weekStartsOn: 0,
    weekEndsOn: 6,
    events,
  });
  return {
    start: span.start < start ? span.start : start,
    end: span.end > end ? span.end : end,
  };
}
