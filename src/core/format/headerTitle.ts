/**
 * @file Header title per view (ported from web `components/layout/Header.tsx`).
 */
import { formatDate, type DateType } from "../utils/date";
import { ECalendarViewType, type VisibleRange } from "../types";
import { DATE_FORMATS } from "../constants";

/** Input for `getHeaderTitle`. */
export interface HeaderTitleInput {
  view: ECalendarViewType;
  selectedDate: DateType;
  /** Days shown by Week, Day and Custom Days (`getVisibleDays`). */
  visibleDays: DateType[];
  /** Schedule window (`getVisibleRange("schedule", …)`). */
  scheduleRange?: VisibleRange;
  locale: string;
  showWeekNumbers: boolean;
  /** Phone header: shorter Custom Days title. */
  compact: boolean;
}

/** "Oct - Nov 2026", "Dec 2026 - Jan 2027" or "Oct 2026" for a span of days. */
function monthSpan(start: DateType, end: DateType, locale: string): string {
  if (start.month !== end.month || start.year !== end.year) {
    if (start.year !== end.year) {
      return `${formatDate(start, DATE_FORMATS.SHORT_MONTH_YEAR, locale)} - ${formatDate(end, DATE_FORMATS.SHORT_MONTH_YEAR, locale)}`;
    }
    return `${formatDate(start, DATE_FORMATS.SHORT_MONTH, locale)} - ${formatDate(end, DATE_FORMATS.SHORT_MONTH_YEAR, locale)}`;
  }
  return formatDate(start, DATE_FORMATS.SHORT_MONTH_YEAR, locale);
}

/**
 * Returns the header title. Week follows its visible days (#4), Schedule
 * follows its window, and compact Custom Days reads "22 - 24 Oct 2026".
 */
export function getHeaderTitle({
  view,
  selectedDate,
  visibleDays,
  scheduleRange,
  locale,
  showWeekNumbers,
  compact,
}: HeaderTitleInput): string {
  const weekSuffix =
    view === ECalendarViewType.week && showWeekNumbers
      ? `  ·  W${selectedDate.weekNumber}`
      : "";

  if (view === ECalendarViewType.day) {
    return formatDate(selectedDate, DATE_FORMATS.MONTH_DAY_YEAR, locale);
  }
  if (view === ECalendarViewType.week) {
    const startOfWeek = visibleDays[0] ?? selectedDate;
    const endOfWeek = visibleDays[visibleDays.length - 1] ?? selectedDate;
    const baseString =
      startOfWeek.month !== endOfWeek.month
        ? monthSpan(startOfWeek, endOfWeek, locale)
        : formatDate(startOfWeek, DATE_FORMATS.MONTH_YEAR, locale);
    return `${baseString}${weekSuffix}`;
  }
  if (view === ECalendarViewType.customDays) {
    const startDate = visibleDays[0] ?? selectedDate;
    const endDate = visibleDays[visibleDays.length - 1] ?? selectedDate;
    if (visibleDays.length <= 1) {
      return formatDate(startDate, DATE_FORMATS.MONTH_DAY_YEAR, locale);
    }
    if (compact) {
      const year = formatDate(endDate, "yyyy", locale);
      if (
        startDate.month === endDate.month &&
        startDate.year === endDate.year
      ) {
        return `${formatDate(startDate, "d", locale)} - ${formatDate(endDate, "d MMM", locale)} ${year}`;
      }
      return `${formatDate(startDate, "d MMM", locale)} - ${formatDate(endDate, "d MMM", locale)} ${year}`;
    }
    if (startDate.month !== endDate.month) {
      return monthSpan(startDate, endDate, locale);
    }
    return `${formatDate(startDate, DATE_FORMATS.DAY_DATE_SHORT_MONTH, locale)} - ${formatDate(endDate, DATE_FORMATS.DAY_DATE_SHORT_MONTH, locale)}, ${formatDate(startDate, "yyyy", locale)}`;
  }
  if (view === ECalendarViewType.schedule && scheduleRange) {
    return monthSpan(scheduleRange.start, scheduleRange.end, locale);
  }
  return formatDate(selectedDate, DATE_FORMATS.MONTH_YEAR, locale);
}
