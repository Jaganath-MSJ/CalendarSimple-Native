/**
 * @file Debounced `onDateRangeChange` (TDD §8.4).
 */
import { useEffect, useMemo, useRef } from "react";
import { getVisibleRange } from "../core";
import { useCalendar } from "../context/CalendarContext";

const DELAY_MS = 16;

/**
 * Call once inside the provider. When the visible range key
 * `"<view>|<startISO>|<endISO>"` changes (mount, navigation, view change, and
 * in Schedule — which spans all events — an events change that moves the
 * span), fires `onDateRangeChange(start, end, view)` after 16 ms; a newer key
 * cancels the pending call.
 */
export function useDateRangeNotifier(): void {
  const { state, config } = useCalendar();
  const { view, selectedDate, customDays } = state;
  const { weekStartsOn, weekEndsOn, events, onDateRangeChange } = config;

  const range = useMemo(
    () =>
      getVisibleRange(view, selectedDate, {
        weekStartsOn,
        weekEndsOn,
        customDays,
        events,
      }),
    [view, selectedDate, weekStartsOn, weekEndsOn, customDays, events],
  );
  const key = `${view}|${range.start.toISODate()}|${range.end.toISODate()}`;

  // Latest callback and range without making them effect keys.
  const latest = useRef({ onDateRangeChange, range, view });
  useEffect(() => {
    latest.current = { onDateRangeChange, range, view };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const { onDateRangeChange: cb, range: r, view: v } = latest.current;
      cb?.(r.start.toJSDate(), r.end.toJSDate(), v);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [key]);
}
