/**
 * @file Memoised schedule groups: every event, grouped by day (port spec
 * §4.5; no window since 1.1, as calendar-simple).
 */
import { useMemo } from "react";
import {
  ECalendarViewType,
  getScheduleExpansionWindow,
  getVisibleRange,
  groupScheduleEvents,
  type CalendarState,
  type ScheduleGroup,
} from "../core";
import type { CalendarEvent, ResolvedConfig } from "../types";
import { useToday } from "./useNow";

type GroupsConfig = Pick<ResolvedConfig, "weekStartsOn" | "weekEndsOn">;

/**
 * `groupScheduleEvents` over the span of all events (no events: the selected
 * day). A multi-day event fills its days only inside the window around the
 * selected date (`getScheduleExpansionWindow`), plus its first day.
 * Memoised on the events, that window and today's date.
 */
export function useScheduleGroups<E extends CalendarEvent>(
  events: E[],
  state: Pick<CalendarState, "selectedDate">,
  cfg: GroupsConfig,
): ScheduleGroup<E>[] {
  const today = useToday();
  const { selectedDate } = state;
  const { weekStartsOn, weekEndsOn } = cfg;
  // The window moves by whole quarters; an empty list also shows the day.
  const window = getScheduleExpansionWindow(selectedDate);
  const key =
    events.length === 0 ? selectedDate.toISODate() : window.start.toISODate();
  return useMemo(
    () =>
      groupScheduleEvents(
        events,
        getVisibleRange(ECalendarViewType.schedule, selectedDate, {
          weekStartsOn,
          weekEndsOn,
          events,
        }),
        window,
      ),
    // `selectedDate` is keyed by value; `today` refreshes after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, today, events, weekStartsOn, weekEndsOn],
  );
}
