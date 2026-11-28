/**
 * @file Schedule lists every event (1.1), and Jest renders only the first
 * rows of a list. Tests about the rows of one day keep the events that start
 * on or after it, so that day is the first section, as with 1.0's window.
 */
import { dateFn } from "../core";
import type { CalendarEvent } from "../types";

/** The events that start on or after `isoDay`. */
export function eventsFrom<E extends CalendarEvent>(
  isoDay: string,
  events: readonly E[],
): E[] {
  const day = dateFn(isoDay).startOf("day");
  return events.filter((e) => dateFn(e.startDate).startOf("day") >= day);
}
