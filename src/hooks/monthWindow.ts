/**
 * @file Pre-filter for the month grid (P9.S4): `buildMonthGrid` scans every
 * event for every grid, so with 1,000 events each pager page cost ~1 s on
 * Hermes. Only events overlapping the grid's weeks can appear in it.
 */
import { Settings } from "luxon";
import { dateFn, type DateType } from "../core";

interface Span {
  start: number;
  end: number;
}

/**
 * Parsed `[start, end]` in millis by `startDate|endDate`; `null` when the
 * span does not parse or is negative. Keyed on the default zone and the strings, so a new event
 * object with the same dates (e.g. a re-created events array) hits the cache.
 */
const spans = new Map<string, Span | null>();
/** Cleared when it grows past this many distinct date pairs. */
const MAX_SPANS = 20_000;

function spanOf(e: { startDate: string; endDate?: string }): Span | null {
  // Zone-less strings parse in the default zone, so it is part of the key.
  const key = `${Settings.defaultZone.name}|${e.startDate}|${e.endDate ?? ""}`;
  if (spans.has(key)) return spans.get(key)!;
  const start = dateFn(e.startDate);
  let span: Span | null = null;
  const end = e.endDate ? dateFn(e.endDate) : start;
  // Unparseable or negative spans stay `null` (kept for the core to report).
  if (start.isValid && end.isValid && end >= start) {
    span = {
      start: start.startOf("day").toMillis(),
      // A date-only end is inclusive; any end counts for its whole day.
      end: end.endOf("day").toMillis(),
    };
  }
  if (spans.size >= MAX_SPANS) spans.clear();
  spans.set(key, span);
  return span;
}

/**
 * Events that can show in `month`'s grid: those overlapping the month plus
 * a week on either side (a grid shows at most 6 adjacent days per side).
 * Unparseable and negative-duration events are kept, so the core still drops and reports them.
 * Parsing is cached per `startDate|endDate`.
 */
export function windowEvents<E extends { startDate: string; endDate?: string }>(
  events: E[],
  month: DateType,
): E[] {
  return eventsInRange(
    events,
    month.startOf("month").minus({ days: 7 }),
    month.endOf("month").plus({ days: 7 }),
  );
}

/**
 * Events overlapping the days `first`…`last` (whole days), plus unparseable
 * and negative-duration ones for the core to report. Used before the
 * time-grid and banner layouts, which also scan every event per call.
 */
export function eventsInRange<
  E extends { startDate: string; endDate?: string },
>(events: E[], first: DateType, last: DateType): E[] {
  const from = first.startOf("day").toMillis();
  const to = last.endOf("day").toMillis();
  return events.filter((e) => {
    const s = spanOf(e);
    return s === null || (s.start <= to && s.end >= from);
  });
}
