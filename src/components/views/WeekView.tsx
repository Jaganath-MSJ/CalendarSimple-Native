/**
 * @file Week view: the time grid for the week around the selected date
 * (port spec §4.3).
 */
import type { DateType } from "../../core";
import { useCalendarState } from "../../context/CalendarContext";
import { ViewConfigProvider } from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import { useVisibleDays } from "../../hooks/useVisibleDays";
import type { CalendarProps, CalendarStyles } from "../../types";
import { TimeGridView } from "../timegrid/TimeGridView";

/** Keys every time-grid view accepts (port spec §2.7, plus native keys). */
type TimeGridKey =
  | "is12Hour"
  | "dayType"
  | "onEventClick"
  | "onEventLongPress"
  | "theme"
  | "showCurrentTime"
  | "maxEvents"
  | "autoScrollToCurrentTime"
  | "minHour"
  | "maxHour"
  | "renderEvent"
  | "renderHourCell"
  | "renderDateCell"
  | "showAllDayRow"
  | "eventOverlapOffset"
  | "enableEnrichedEvents"
  | "enrichedEventsByDate"
  | "eventsAreSorted"
  | "isEventOrderingEnabled"
  | "creatable"
  | "onSlotClick"
  | "slotPressMode";

/** Shared extras: `styles` (replaces `classNames`) and the pager's page date. */
export interface TimeGridExtras {
  styles?: CalendarStyles;
  /** Internal: the period a pager page shows (default `state.selectedDate`). */
  date?: DateType;
}

export type DayViewProps = Partial<Pick<CalendarProps, TimeGridKey>> &
  TimeGridExtras;
export type WeekViewProps = Partial<
  Pick<CalendarProps, TimeGridKey | "weekStartsOn" | "weekEndsOn">
> &
  TimeGridExtras;
export type CustomDaysViewProps = Partial<
  Pick<CalendarProps, TimeGridKey | "customDays">
> &
  TimeGridExtras;

export function WeekView({ date, ...local }: WeekViewProps) {
  const cfg = useCalendarProps(local);
  const { state } = useCalendarState();
  const days = useVisibleDays("week", date ?? state.selectedDate, cfg);
  return (
    <ViewConfigProvider value={cfg}>
      <TimeGridView days={days} variant="week" testIDSuffix="week-view" />
    </ViewConfigProvider>
  );
}
