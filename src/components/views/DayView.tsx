/**
 * @file Day view: the time grid for the selected date (port spec §4.3).
 */
import { useCalendarState } from "../../context/CalendarContext";
import { ViewConfigProvider } from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import { useVisibleDays } from "../../hooks/useVisibleDays";
import { TimeGridView } from "../timegrid/TimeGridView";
import type { DayViewProps } from "./WeekView";

export type { DayViewProps } from "./WeekView";

export function DayView({ date, ...local }: DayViewProps) {
  const cfg = useCalendarProps(local);
  const { state } = useCalendarState();
  const days = useVisibleDays("day", date ?? state.selectedDate, cfg);
  return (
    <ViewConfigProvider value={cfg}>
      <TimeGridView days={days} variant="day" testIDSuffix="day-view" />
    </ViewConfigProvider>
  );
}
