/**
 * @file Custom Days view: `customDays` days from the selected date. Any
 * value is clamped to 1–7 (default 3), so the view always draws.
 */
import { clampCustomDays } from "../../core";
import { useCalendarState } from "../../context/CalendarContext";
import { ViewConfigProvider } from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import { useVisibleDays } from "../../hooks/useVisibleDays";
import { TimeGridView } from "../timegrid/TimeGridView";
import type { CustomDaysViewProps } from "./WeekView";

export type { CustomDaysViewProps } from "./WeekView";

export function CustomDaysView({
  date,
  customDays: localDays,
  ...local
}: CustomDaysViewProps) {
  const cfg = useCalendarProps(local);
  const { state } = useCalendarState();
  const customDays = clampCustomDays(localDays ?? state.customDays);
  const days = useVisibleDays("customDays", date ?? state.selectedDate, {
    weekStartsOn: cfg.weekStartsOn,
    weekEndsOn: cfg.weekEndsOn,
    customDays,
  });
  return (
    <ViewConfigProvider value={cfg}>
      <TimeGridView
        days={days}
        variant="custom"
        testIDSuffix="custom-days-view"
      />
    </ViewConfigProvider>
  );
}
