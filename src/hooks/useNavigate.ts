/**
 * @file Previous/next navigation shared by the header and the pager.
 */
import { useCallback, useEffect, useRef } from "react";
import { getNavigatedDate, type DateType } from "../core";
import { useCalendar } from "../context/CalendarContext";

/**
 * Returns `navigate(target)`: `1`/`-1` dispatches `NEXT`/`PREV`; a date
 * (Today, pickers) dispatches `SET_DATE`. Either way `onNavigate` gets the new
 * date. Calls made before the next render chain from the previous call's
 * target, so rapid repeats (including Today then ›) report the right dates.
 */
export function useNavigate(
  /** Overrides `config.onNavigate` (e.g. `Calendar.Header` props). */
  onNavigateOverride?: (date: Date) => void,
): (target: 1 | -1 | DateType) => void {
  const { state, dispatch, config } = useCalendar();
  const { view, customDays, selectedDate } = state;
  const onNavigate = onNavigateOverride ?? config.onNavigate;
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
    (target: 1 | -1 | DateType) => {
      const { view: v, customDays: c, onNavigate: cb } = latest.current;
      if (typeof target !== "number") {
        pending.current = target;
        dispatch({ type: "SET_DATE", payload: target });
        cb?.(target.toJSDate());
        return;
      }
      const direction = target;
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
