/**
 * @file Memoised schedule groups for the current window (port spec §4.5).
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
import { useNow } from "./useNow";

type GroupsConfig = Pick<
  ResolvedConfig,
  "weekStartsOn" | "weekEndsOn" | "scheduleDays"
>;

/**
 * `groupScheduleEvents` over `selectedDate … +scheduleDays+scheduleExtraDays−1`
 * (#6C), memoised on the window, the events and today's date.
 */
export function useScheduleGroups<E extends CalendarEvent>(
  events: E[],
  state: Pick<
    CalendarState,
    "selectedDate" | "customDays" | "scheduleExtraDays"
  >,
  cfg: GroupsConfig,
): ScheduleGroup<E>[] {
  const today = useNow().toISODate();
  const { selectedDate, customDays, scheduleExtraDays } = state;
  const { weekStartsOn, weekEndsOn, scheduleDays } = cfg;
  const key = selectedDate.toISODate();
  return useMemo(
    () =>
      groupScheduleEvents(
        events,
        getVisibleRange(ECalendarViewType.schedule, selectedDate, {
          weekStartsOn,
          weekEndsOn,
          customDays,
          scheduleDays,
          scheduleExtraDays,
        }),
      ),
    // `selectedDate` is keyed by value; `today` refreshes after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      key,
      today,
      events,
      weekStartsOn,
      weekEndsOn,
      customDays,
      scheduleDays,
      scheduleExtraDays,
    ],
  );
}
