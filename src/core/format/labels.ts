/**
 * @file Cached hour, weekday and month labels per locale.
 */
import { DateTime } from "luxon";
import { formatDate } from "../utils/date";
import { getDayListNames, getMonthList } from "../utils/formatting";
import { DATE_FORMATS, TIME_CONSTANTS } from "../constants";
import type { EDayType } from "../types";

/** Labels the views reuse on every render. */
export interface LabelCache {
  /** 24 hour labels: `HH:mm`, or `hh a` when `is12Hour`. */
  hourLabels: string[];
  /** Weekday names, Sunday first (`getDayListNames`). */
  weekdayNames: string[];
  /** 12 long month names. */
  monthNames: string[];
}

const cache = new Map<string, LabelCache>();

/**
 * Builds (once per `locale` / `is12Hour` / `dayType` triple) the hour,
 * weekday and month labels. Returns the same object for the same arguments.
 */
export function buildLabelCache(
  locale: string,
  is12Hour: boolean,
  dayType: EDayType,
): LabelCache {
  const key = `${locale}|${is12Hour ? 12 : 24}|${dayType}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const format = is12Hour ? DATE_FORMATS.HOUR_12H : DATE_FORMATS.TIME;
  const midnight = DateTime.fromObject({ year: 2000, month: 1, day: 1 });
  const labels: LabelCache = {
    hourLabels: Array.from({ length: TIME_CONSTANTS.HOURS_IN_DAY }, (_, h) =>
      formatDate(midnight.set({ hour: h }), format, locale),
    ),
    weekdayNames: getDayListNames(dayType, locale),
    monthNames: getMonthList(locale).map((m) => m.label),
  };
  cache.set(key, labels);
  return labels;
}
