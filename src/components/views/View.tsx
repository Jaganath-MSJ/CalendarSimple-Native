/**
 * @file `Calendar.View`: renders the active view (month for now; the time
 * grids and schedule arrive in later phases).
 */
import { useCalendarState } from "../../context/CalendarContext";
import type { DateType } from "../../core";
import type { CalendarProps } from "../../types";
import { MonthView } from "./MonthView";

export type ViewProps = Partial<CalendarProps> & {
  /** Internal: the period a pager page shows (default `state.selectedDate`). */
  date?: DateType;
};

export function View({ date, ...props }: ViewProps) {
  const { state } = useCalendarState();
  switch (state.view) {
    case "month":
      return <MonthView {...props} date={date} />;
    default:
      return null;
  }
}
