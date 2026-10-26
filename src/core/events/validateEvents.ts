/**
 * @file validateEvents.ts
 * @description Pure validation of a list of calendar events (ported from the web
 * `useEvents` hook, split into a filter and a warning list).
 *
 * Filters out completely invalid events: events whose `startDate` or `endDate`
 * cannot be parsed, and events whose end date chronologically precedes the start.
 */

import { dateFn } from "../utils/date";
import type { BaseCalendarEvent } from "../types";

/** Options shared by `validateEvents` and `getEventWarnings`. */
export interface ValidateEventsOptions {
  /**
   * When `true`, skips validation and returns events as-is (caller guarantees
   * events are pre-sorted by `startDate` ascending). **Caveat:** unsorted input
   * will render in the provided order — the library never re-sorts the array.
   */
  eventsAreSorted?: boolean;
  /** When `true`, skips validation (caller supplies pre-enriched events via `enrichedEventsByDate`). */
  enableEnrichedEvents?: boolean;
}

const K03_WARNING =
  "[calendar] eventsAreSorted=true but the provided events array is not sorted by startDate ascending. " +
  "Events may render in the wrong visual order. " +
  "Either sort the array before passing it, or remove the eventsAreSorted flag.";

const K05_WARNING =
  "[calendar] enableEnrichedEvents=true but enrichedEventsByDate was not provided. " +
  "The calendar will fall back to flat-array event lookup — multi-day events may render incorrectly. " +
  "Pass a valid enrichedEventsByDate map alongside enableEnrichedEvents.";

function hasValidDates(event: BaseCalendarEvent): boolean {
  if (event.startDate == null || !dateFn(event.startDate).isValid) {
    return false;
  }
  return !event.endDate || dateFn(event.endDate).isValid;
}

function shouldValidate(opts: ValidateEventsOptions): boolean {
  return !(opts.eventsAreSorted || opts.enableEnrichedEvents);
}

/**
 * Returns only the valid events.
 *
 * Events with an unparseable `startDate` or `endDate` are dropped (reported by
 * `getEventWarnings`). Events where `endDate` is chronologically before
 * `startDate` are silently removed — they have no renderable duration (C-TC3).
 * With `eventsAreSorted` or `enableEnrichedEvents`, events pass through unchanged.
 */
export function validateEvents<E extends BaseCalendarEvent>(
  events: E[],
  opts: ValidateEventsOptions,
): E[] {
  if (!shouldValidate(opts)) {
    return events;
  }

  return events.filter((event) => {
    if (!hasValidDates(event)) return false;
    if (!event.endDate) return true;
    return dateFn(event.endDate) >= dateFn(event.startDate);
  });
}

/**
 * Returns the dev warnings for an event list: K-03 (`eventsAreSorted` with an
 * unsorted array), K-05 (`enableEnrichedEvents` without `enrichedEventsByDate`)
 * and the count of events dropped for invalid dates.
 */
export function getEventWarnings<E extends BaseCalendarEvent>(
  events: E[],
  opts: ValidateEventsOptions & {
    enrichedEventsByDate?: Record<string, E[]>;
  },
): string[] {
  const warnings: string[] = [];

  // K-03: eventsAreSorted=true but the array is not actually sorted.
  if (opts.eventsAreSorted) {
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];
      if (
        current &&
        previous &&
        dateFn(current.startDate) < dateFn(previous.startDate)
      ) {
        warnings.push(K03_WARNING);
        break;
      }
    }
  }

  // K-05: enableEnrichedEvents=true but enrichedEventsByDate is absent.
  if (opts.enableEnrichedEvents && opts.enrichedEventsByDate === undefined) {
    warnings.push(K05_WARNING);
  }

  if (shouldValidate(opts)) {
    const dropped = events.filter((event) => !hasValidDates(event)).length;
    if (dropped > 0) {
      warnings.push(
        `[calendar] dropped ${dropped} event(s) with an invalid startDate or endDate.`,
      );
    }
  }

  return warnings;
}
