/**
 * @file Shared navigation maths for the reducer and the pager's neighbour pages.
 */
import type { DateType } from "../utils/date";
import { clampCustomDays } from "../utils/customDays";
import { ECalendarViewType } from "../types";
import type { CalendarState } from "./calendarReducer";

/**
 * Returns the date `NEXT` (`direction = 1`) or `PREV` (`-1`) moves to.
 * Navigation units map directly to Luxon duration keys (`month`, `week`, `day`)
 * and `customDays` moves by `customDays` (1–7, default 3). `schedule` lists
 * every event and has no Prev/Next, so the date is returned unchanged (as
 * calendar-simple). Never clamped to the year list (#12A).
 */
export function getNavigatedDate(
  state: Pick<CalendarState, "selectedDate" | "view" | "customDays">,
  direction: 1 | -1,
): DateType {
  // Schedule has no Prev/Next (it lists every event): the date stays.
  if (state.view === ECalendarViewType.schedule) return state.selectedDate;
  if (state.view === ECalendarViewType.customDays) {
    return state.selectedDate.plus({
      days: direction * clampCustomDays(state.customDays),
    });
  }
  return state.selectedDate.plus({ [state.view]: direction });
}
