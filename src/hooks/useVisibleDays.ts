/**
 * @file Memoised `getVisibleDays` for the time-grid views.
 */
import { useMemo } from "react";
import {
  getVisibleDays,
  type DateType,
  type VisibleDaysOptions,
} from "../core";

/**
 * The days a Week, Day or Custom Days view shows. The array keeps its
 * identity while `view | first day | length` stays the same.
 */
export function useVisibleDays(
  view: "week" | "day" | "customDays",
  date: DateType,
  cfg: VisibleDaysOptions,
): DateType[] {
  const { weekStartsOn, weekEndsOn, customDays } = cfg;
  const days = getVisibleDays(view, date, {
    weekStartsOn,
    weekEndsOn,
    customDays,
  });
  const key = `${view}|${days[0]?.toISODate() ?? ""}|${days.length}`;
  // Keyed by value so a new `date` object for the same period keeps the array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => days, [key]);
}
