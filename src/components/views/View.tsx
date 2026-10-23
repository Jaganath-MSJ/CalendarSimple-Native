/**
 * @file `Calendar.View`: renders the active view.
 */
import { useCalendarState } from "../../context/CalendarContext";
import type { DateType } from "../../core";
import type { CalendarProps } from "../../types";
import { CustomDaysView } from "./CustomDaysView";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import { ScheduleView } from "./ScheduleView";
import { WeekView } from "./WeekView";

export type ViewProps = Partial<CalendarProps> & {
  /** Internal: the period a pager page shows (default `state.selectedDate`). */
  date?: DateType;
};

export function View({ date, ...props }: ViewProps) {
  const { state } = useCalendarState();
  switch (state.view) {
    case "month":
      return <MonthView {...props} date={date} />;
    case "week":
      return <WeekView {...props} date={date} />;
    case "day":
      return <DayView {...props} date={date} />;
    case "customDays":
      return <CustomDaysView {...props} date={date} />;
    case "schedule":
      return <ScheduleView {...props} />;
    default:
      return null;
  }
}
