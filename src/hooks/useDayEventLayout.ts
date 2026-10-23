/**
 * @file Memoised `layoutDayEvents` for the visible days (port spec §5.6).
 */
import { useMemo } from "react";
import { layoutDayEvents, type DateType, type DayEventLayout } from "../core";
import type { CalendarEvent, ResolvedConfig } from "../types";
import { eventsInRange } from "./monthWindow";

/** Only events touching `days` can be laid out in them. */
export function inRange<E extends CalendarEvent>(
  events: E[],
  days: DateType[],
): E[] {
  const first = days[0];
  const last = days[days.length - 1];
  return first && last ? eventsInRange(events, first, last) : events;
}

type LayoutConfig<E extends CalendarEvent> = Pick<
  ResolvedConfig<E>,
  | "minHour"
  | "maxHour"
  | "showAllDayRow"
  | "eventOverlapOffset"
  | "enableEnrichedEvents"
  | "enrichedEventsByDate"
  | "eventsAreSorted"
  | "isEventOrderingEnabled"
>;

/** One layout array per day; `top`/`height` in wall-clock minutes. */
export function useDayEventLayout<E extends CalendarEvent>(
  events: E[],
  days: DateType[],
  cfg: LayoutConfig<E>,
): DayEventLayout<E>[][] {
  const {
    minHour,
    maxHour,
    showAllDayRow,
    eventOverlapOffset,
    enableEnrichedEvents,
    enrichedEventsByDate,
    eventsAreSorted,
    isEventOrderingEnabled,
  } = cfg;
  return useMemo(
    () =>
      layoutDayEvents(inRange(events, days), days, {
        minHour,
        maxHour,
        showAllDayRow,
        eventOverlapOffset,
        enableEnrichedEvents,
        enrichedEventsByDate,
        eventsAreSorted,
        isEventOrderingEnabled,
      }),
    [
      events,
      days,
      minHour,
      maxHour,
      showAllDayRow,
      eventOverlapOffset,
      enableEnrichedEvents,
      enrichedEventsByDate,
      eventsAreSorted,
      isEventOrderingEnabled,
    ],
  );
}
