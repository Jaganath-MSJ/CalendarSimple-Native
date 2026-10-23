/**
 * @file Schedule view: the event list for the window starting at the
 * selected date (port spec §4.5, #6C).
 */
import { ViewConfigProvider } from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import type { DateType } from "../../core";
import type { CalendarProps, CalendarStyles } from "../../types";
import { ScheduleList } from "../schedule/ScheduleList";

/** The web `ScheduleViewProps` keys plus native ones (`styles` replaces `classNames`). */
export type ScheduleViewProps = Partial<
  Pick<
    CalendarProps,
    | "is12Hour"
    | "dayType"
    | "onEventClick"
    | "onEventLongPress"
    | "theme"
    | "autoScrollToCurrentTime"
    | "renderEvent"
    | "renderScheduleSeparator"
    | "scheduleDays"
    | "onRefresh"
    | "refreshing"
    | "onEndReached"
  >
> & {
  styles?: CalendarStyles;
  /** Internal: ignored (the schedule does not page). */
  date?: DateType;
};

export function ScheduleView({ date: _date, ...local }: ScheduleViewProps) {
  const cfg = useCalendarProps(local);
  return (
    <ViewConfigProvider value={cfg}>
      <ScheduleList />
    </ViewConfigProvider>
  );
}
