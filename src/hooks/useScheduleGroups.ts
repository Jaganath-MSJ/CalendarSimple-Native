/**
 * @file Memoised schedule groups: every event, grouped by day (port spec
 * §4.5; no window since 1.1, as calendar-simple).
 */
import { useMemo } from "react";
import {
  ECalendarViewType,
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
 * day), memoised on the events and today's date.
 */
export function useScheduleGroups<E extends CalendarEvent>(
  events: E[],
  state: Pick<CalendarState, "selectedDate">,
  cfg: GroupsConfig,
): ScheduleGroup<E>[] {
  const today = useToday();
  const { selectedDate } = state;
  const { weekStartsOn, weekEndsOn } = cfg;
  // Only an empty list depends on the selected day.
  const key = events.length === 0 ? selectedDate.toISODate() : "";
  return useMemo(
    () =>
      groupScheduleEvents(
        events,
        getVisibleRange(ECalendarViewType.schedule, selectedDate, {
          weekStartsOn,
          weekEndsOn,
          events,
        }),
      ),
    // `selectedDate` is keyed by value; `today` refreshes after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, today, events, weekStartsOn, weekEndsOn],
  );
}
