/**
 * @file Previous/next navigation shared by the header and the pager.
 */
import { useCallback, useEffect, useRef } from "react";
import { getNavigatedDate, type DateType } from "../core";
import { useCalendar } from "../context/CalendarContext";

/**
 * Returns `navigate(direction)`: dispatches `NEXT`/`PREV` and calls
 * `onNavigate` with the new date. Calls made before the next render chain
 * from the previous call's target, so rapid repeats report the right dates.
 */
export function useNavigate(): (direction: 1 | -1) => void {
  const { state, dispatch, config } = useCalendar();
  const { view, customDays, selectedDate } = state;
  const { onNavigate } = config;
  const pending = useRef<DateType | null>(null);
  const latest = useRef({ view, customDays, onNavigate });
  useEffect(() => {
    latest.current = { view, customDays, onNavigate };
    pending.current = null;
  }, [view, customDays, onNavigate, selectedDate]);
  const base = useRef(selectedDate);
  useEffect(() => {
    base.current = selectedDate;
  }, [selectedDate]);

  return useCallback(
    (direction: 1 | -1) => {
      const { view: v, customDays: c, onNavigate: cb } = latest.current;
      const next = getNavigatedDate(
        {
          view: v,
          customDays: c,
          selectedDate: pending.current ?? base.current,
        },
        direction,
      );
      pending.current = next;
      dispatch({ type: direction === 1 ? "NEXT" : "PREV" });
      cb?.(next.toJSDate());
    },
    [dispatch],
  );
}
