/**
 * @file scheduleGroups.ts
 * @description Groups and formats data for the 'Schedule' (agenda) layout view.
 *
 * This module handles:
 * 1. Sorting events broadly by start date.
 * 2. Grouping events into discrete days (replicating events that span multiple days),
 *    limited to the visible schedule window (#6C).
 * 3. Formatting specific time displays and titles accommodating multi-day spans.
 *
 * Ported from web `hooks/useScheduleView.ts` without refs or effects; the
 * auto-scroll lives in the React Native layer.
 */

import type { BaseCalendarEvent, ScheduleGroup, VisibleRange } from "../types";
import {
  formatDate,
  dateFn,
  type DateType,
  getDiffDays,
  getStartOfDay,
} from "../utils/date";
import { getLastEventDay, isAllDayEvent } from "../utils/common";
import { DATE_FORMATS } from "../constants";
import type { CalendarMessages } from "../i18n";

/**
 * Groups events by every day they span, keeping only days inside `range`
 * (both ends inclusive). Groups are sorted by `dateKey`; events inside a
 * group keep start-date order.
 */
export function groupScheduleEvents<E extends BaseCalendarEvent>(
  events: E[],
  range: VisibleRange,
): ScheduleGroup<E>[] {
  // -------------------------------------------------------------------------
  // 1. Initial Sorting
  // -------------------------------------------------------------------------
  // Sort events by start date
  const sorted = [...events].sort(
    (a, b) => dateFn(a.startDate).valueOf() - dateFn(b.startDate).valueOf(),
  );

  const rangeStart = range.start.startOf("day");
  const rangeEnd = range.end.startOf("day");
  const groups = new Map<string, ScheduleGroup<E>>();

  // -------------------------------------------------------------------------
  // 2. Multi-day span resolution and Grouping
  // -------------------------------------------------------------------------
  sorted.forEach((event) => {
    // Group by every date the event spans, clipped to the window (#6C)
    const first = dateFn(event.startDate).startOf("day");
    let current = first < rangeStart ? rangeStart : first;
    const last = getLastEventDay(event);
    const end = last > rangeEnd ? rangeEnd : last;

    while (current < end || current.equals(end)) {
      const dateKey = formatDate(current, DATE_FORMATS.DATE);
      let group = groups.get(dateKey);
      if (!group) {
        group = { dateKey, date: current, events: [] };
        groups.set(dateKey, group);
      }
      group.events.push(event);
      current = current.plus({ days: 1 }).startOf("day");
    }
  });

  return [...groups.values()].sort((a, b) =>
    a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0,
  );
}

/** Options for `getScheduleTimeLabel`. */
export interface ScheduleTimeLabelOptions {
  is12Hour: boolean;
  locale: string;
  messages: CalendarMessages;
}

/**
 * Formats the time range string for an event on a specific day.
 * Modifies display smartly if it's a multi-day event continuing from a prior day
 * or ending on a subsequent day (e.g. "All day", "Until 10 PM"). Whitespace is
 * collapsed and trimmed (#7).
 */
export function getScheduleTimeLabel(
  event: BaseCalendarEvent,
  day: DateType,
  { is12Hour, locale, messages }: ScheduleTimeLabelOptions,
): string {
  return renderEventTime(event, day, is12Hour, locale, messages)
    .replace(/\s+/g, " ")
    .trim();
}

function renderEventTime(
  event: BaseCalendarEvent,
  day: DateType,
  is12Hour: boolean,
  locale: string,
  messages: CalendarMessages,
): string {
  if (isAllDayEvent(event)) {
    return messages.allDay;
  }

  const currentDay = dateFn(day).startOf("day");
  const startDay = dateFn(event.startDate).startOf("day");
  const endDay = getLastEventDay(event);
  const isMultiDay = !startDay.equals(endDay);

  const timeFormat = is12Hour ? DATE_FORMATS.TIME_12H : DATE_FORMATS.TIME;
  const formatTime = (t: string) => t.replace(/^0/, "").replace(":00", " ");

  const isMidnight = (d: string) =>
    dateFn(d).hour === 0 && dateFn(d).minute === 0;
  const isEndOfDay = (d: string) =>
    dateFn(d).hour === 23 && dateFn(d).minute === 59;

  if (isMultiDay) {
    const endDate = event.endDate ?? event.startDate;
    if (currentDay.equals(startDay)) {
      return isMidnight(event.startDate)
        ? messages.allDay
        : `${formatTime(formatDate(event.startDate, timeFormat, locale))}`;
    } else if (currentDay.equals(endDay)) {
      // A 00:00 end means the event runs to the end of its last day
      return isEndOfDay(endDate) || isMidnight(endDate)
        ? messages.allDay
        : `${messages.until} ${formatTime(formatDate(endDate, timeFormat, locale))}`;
    } else {
      return messages.allDay;
    }
  }

  // Normal single day time range
  const startStr = formatDate(event.startDate, timeFormat, locale);
  if (event.endDate) {
    const endsAtNextMidnight =
      isMidnight(event.endDate) &&
      dateFn(event.endDate) > dateFn(event.startDate);
    if (
      isMidnight(event.startDate) &&
      (isEndOfDay(event.endDate) || endsAtNextMidnight)
    ) {
      return messages.allDay;
    }
    const endStr = formatDate(event.endDate, timeFormat, locale);
    return `${formatTime(startStr)} – ${formatTime(endStr)}`;
  }
  return formatTime(startStr);
}

/**
 * Formats the title of an event. Appends descriptive text if the event
 * spans multiple days (e.g., "Event Name (Day 2/3)").
 */
export function getScheduleTitle(
  event: BaseCalendarEvent,
  day: DateType,
  messages: CalendarMessages,
): string {
  const startDay = getStartOfDay(event.startDate);
  const lastDay = getLastEventDay(event);
  if (!startDay.equals(lastDay)) {
    const currentDay = getStartOfDay(day);
    const dayIndex = getDiffDays(currentDay, startDay) + 1;
    // Compare day starts so partial days count as whole calendar days
    const totalDays = getDiffDays(lastDay, startDay) + 1;
    return `${event.title} ${messages.dayOfTotal(dayIndex, totalDays)}`;
  }
  return event.title;
}
