/**
 * @file Custom Days view: `customDays` days from the selected date; renders
 * only for 1–10 days (port spec §4.3).
 */
import { useCalendarState } from "../../context/CalendarContext";
import { ViewConfigProvider } from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import { useVisibleDays } from "../../hooks/useVisibleDays";
import { TimeGridView } from "../timegrid/TimeGridView";
import type { CustomDaysViewProps } from "./WeekView";

export type { CustomDaysViewProps } from "./WeekView";

const MAX_CUSTOM_DAYS = 10;
const DEFAULT_CUSTOM_DAYS = 3;

export function CustomDaysView({
  date,
  customDays: localDays,
  ...local
}: CustomDaysViewProps) {
  const cfg = useCalendarProps(local);
  const { state } = useCalendarState();
  const customDays = localDays ?? state.customDays ?? DEFAULT_CUSTOM_DAYS;
  const days = useVisibleDays("customDays", date ?? state.selectedDate, {
    weekStartsOn: cfg.weekStartsOn,
    weekEndsOn: cfg.weekEndsOn,
    customDays,
  });
  if (!(customDays >= 1 && customDays <= MAX_CUSTOM_DAYS)) return null;
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
