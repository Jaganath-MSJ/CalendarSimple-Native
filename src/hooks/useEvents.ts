/**
 * @file Memoised event validation with development warnings.
 */
import { useEffect, useMemo } from "react";
import { getEventWarnings, validateEvents } from "../core";
import type { CalendarEvent } from "../types";

export interface UseEventsConfig<E extends CalendarEvent> {
  eventsAreSorted?: boolean;
  enableEnrichedEvents?: boolean;
  enrichedEventsByDate?: Record<string, E[]>;
}

/**
 * Returns the valid events (`validateEvents`). In `__DEV__`, logs each
 * `getEventWarnings` text with `console.warn` once per change of the inputs.
 */
export function useEvents<E extends CalendarEvent>(
  events: E[],
  cfg: UseEventsConfig<E>,
): E[] {
  const { eventsAreSorted, enableEnrichedEvents, enrichedEventsByDate } = cfg;
  const valid = useMemo(
    () => validateEvents(events, { eventsAreSorted, enableEnrichedEvents }),
    [events, eventsAreSorted, enableEnrichedEvents],
  );
  useEffect(() => {
    if (!__DEV__) return;
    const warnings = getEventWarnings(events, {
      eventsAreSorted,
      enableEnrichedEvents,
      enrichedEventsByDate,
    });
    for (const text of warnings) console.warn(text);
  }, [events, eventsAreSorted, enableEnrichedEvents, enrichedEventsByDate]);
  return valid;
}
