/**
 * @file Shared navigation maths for the reducer and the pager's neighbour pages.
 */
import type { DateType } from "../utils/date";
import { ECalendarViewType } from "../types";
import type { CalendarState } from "./calendarReducer";

/**
 * Returns the date `NEXT` (`direction = 1`) or `PREV` (`-1`) moves to.
 * Navigation units map directly to Luxon duration keys (`month`, `week`, `day`);
 * `schedule` reuses `day` since it paginates one day at a time, and
 * `customDays` moves by `customDays` (default 3). Never clamped to the year
 * list (#12A).
 */
export function getNavigatedDate(
  state: Pick<CalendarState, "selectedDate" | "view" | "customDays">,
  direction: 1 | -1,
): DateType {
  if (state.view === ECalendarViewType.customDays) {
    return state.selectedDate.plus({
      days: direction * (state.customDays || 3),
    });
  }
  const unit = state.view === ECalendarViewType.schedule ? "day" : state.view;
  return state.selectedDate.plus({ [unit]: direction });
}
