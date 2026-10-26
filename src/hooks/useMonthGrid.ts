/**
 * @file Memoised month grid (`buildMonthGrid`) that keeps the app's events.
 */
import { useMemo } from "react";
import {
  buildMonthGrid,
  type CalendarMatrix,
  type DateType,
  type EventListType,
} from "../core";
import type { CalendarEvent, ResolvedConfig } from "../types";
import { windowEvents } from "./monthWindow";
import { useToday } from "./useNow";

const ORIGINAL = Symbol("calendar.original");
type Tagged<E> = E & { [ORIGINAL]?: E };

function tag<E extends CalendarEvent>(e: E): E {
  return { ...e, [ORIGINAL]: e };
}

/**
 * The app's own event object behind a grid entry. `buildMonthGrid` spreads
 * events into new objects; the symbol key survives the spread.
 */
export function originalOf<E extends CalendarEvent>(
  entry: E | EventListType<E>,
): E {
  return (entry as Tagged<E>)[ORIGINAL] ?? entry;
}

type GridConfig<E extends CalendarEvent> = Pick<
  ResolvedConfig<E>,
  | "weekStartsOn"
  | "weekEndsOn"
  | "enableEnrichedEvents"
  | "enrichedEventsByDate"
  | "eventsAreSorted"
  | "isEventOrderingEnabled"
  | "sortedMonthView"
>;

/**
 * `buildMonthGrid(date, events, …)` memoised on the month, the events, the
 * grid options and today's date (so "today" moves at midnight and on resume).
 */
export function useMonthGrid<E extends CalendarEvent>(
  date: DateType,
  events: E[],
  cfg: GridConfig<E>,
): CalendarMatrix<E> {
  const today = useToday();
  const {
    weekStartsOn,
    weekEndsOn,
    enableEnrichedEvents,
    enrichedEventsByDate,
    eventsAreSorted,
    isEventOrderingEnabled,
    sortedMonthView,
  } = cfg;
  const tagged = useMemo(() => events.map(tag), [events]);
  const taggedByDate = useMemo(() => {
    if (!enrichedEventsByDate) return undefined;
    const out: Record<string, E[]> = {};
    for (const [k, list] of Object.entries(enrichedEventsByDate)) {
      out[k] = list.map(tag);
    }
    return out;
  }, [enrichedEventsByDate]);
  const key = date.toMillis();
  return useMemo(
    () =>
      buildMonthGrid(
        date,
        windowEvents(tagged, date),
        weekStartsOn,
        weekEndsOn,
        {
          enableEnrichedEvents,
          enrichedEventsByDate: taggedByDate,
          eventsAreSorted,
          isEventOrderingEnabled,
          sortedMonthView,
        },
      ),
    // `date` is keyed by value; `today` re-runs the grid after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      key,
      today,
      tagged,
      taggedByDate,
      weekStartsOn,
      weekEndsOn,
      enableEnrichedEvents,
      eventsAreSorted,
      isEventOrderingEnabled,
      sortedMonthView,
    ],
  );
}
