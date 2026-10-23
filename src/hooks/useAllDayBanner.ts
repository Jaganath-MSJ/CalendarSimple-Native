/**
 * @file Memoised `layoutAllDayBanner` for the visible days (port spec §5.5).
 */
import { useMemo } from "react";
import { layoutAllDayBanner, type BannerLayout, type DateType } from "../core";
import type { CalendarEvent } from "../types";

/** Banner rows, hidden counts and height for `days` (`maxEvents ?? 3` rows). */
export function useAllDayBanner<E extends CalendarEvent>(
  days: DateType[],
  events: E[],
  expanded: boolean,
  maxEvents = 3,
): BannerLayout<E> {
  return useMemo(
    () => layoutAllDayBanner(days, events, expanded, maxEvents),
    [days, events, expanded, maxEvents],
  );
}
