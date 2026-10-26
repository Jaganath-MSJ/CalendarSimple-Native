/**
 * @file View change shared by the built-in header and `renderHeader`
 * (port spec §5 view select): `SET_VIEW`; if `resetDateOnViewChange`, jump
 * to today through `navigate` (which reports `onNavigate`); then
 * `onViewChange(view)`.
 */
import { useCallback } from "react";
import { dateFn, type DateType, type ECalendarViewType } from "../core";
import { useCalendar } from "../context/CalendarContext";

export function useViewChange(
  navigate: (target: 1 | -1 | DateType) => void,
  overrides: {
    resetDateOnViewChange?: boolean;
    onViewChange?: (view: ECalendarViewType) => void;
  } = {},
): (view: ECalendarViewType) => void {
  const { dispatch, config } = useCalendar();
  const reset = overrides.resetDateOnViewChange ?? config.resetDateOnViewChange;
  const onViewChange = overrides.onViewChange ?? config.onViewChange;
  return useCallback(
    (view: ECalendarViewType) => {
      dispatch({ type: "SET_VIEW", payload: view });
      if (reset) navigate(dateFn());
      onViewChange?.(view);
    },
    [dispatch, navigate, reset, onViewChange],
  );
}
