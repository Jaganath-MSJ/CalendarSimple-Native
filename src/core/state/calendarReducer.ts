/**
 * @file Calendar state reducer (ported from web `context/CalendarContext.tsx`).
 */
import { dateFn, type DateType } from "../utils/date";
import type { ECalendarViewType } from "../types";
import { CALENDAR_ACTIONS } from "../constants";
import { getNavigatedDate } from "./navigation";

/**
 * Mutable runtime state managed by the calendar reducer.
 */
export interface CalendarState {
  /** The currently selected (navigated-to) date. */
  selectedDate: DateType;
  /** The active view mode. */
  view: ECalendarViewType;
  /** Number of days shown when view is `customDays`. */
  customDays?: number;
  /** Days added to the schedule window by `EXTEND_SCHEDULE`; reset by navigation and view change. */
  scheduleExtraDays: number;
}

/**
 * Union of all dispatchable actions for the calendar reducer.
 * - `SET_DATE` — jump to a specific date
 * - `SET_VIEW` — switch the active view
 * - `NEXT` / `PREV` — advance or retreat by one view-unit (month, week, day, or N custom days)
 * - `TODAY` — reset navigation to today
 * - `EXTEND_SCHEDULE` — grow the schedule window by `payload` days
 */
export type CalendarAction =
  | { type: typeof CALENDAR_ACTIONS.SET_DATE; payload: DateType }
  | { type: typeof CALENDAR_ACTIONS.SET_VIEW; payload: ECalendarViewType }
  | {
      type: typeof CALENDAR_ACTIONS.SET_CUSTOM_DAYS;
      payload: number | undefined;
    }
  | { type: typeof CALENDAR_ACTIONS.NEXT }
  | { type: typeof CALENDAR_ACTIONS.PREV }
  | { type: typeof CALENDAR_ACTIONS.TODAY }
  | { type: typeof CALENDAR_ACTIONS.EXTEND_SCHEDULE; payload: number };

/** Builds the reducer's initial state (`scheduleExtraDays: 0`). */
export function createInitialState(
  selectedDate: DateType,
  view: ECalendarViewType,
  customDays?: number,
): CalendarState {
  return { selectedDate, view, customDays, scheduleExtraDays: 0 };
}

/**
 * Pure reducer that computes the next calendar state.
 * `NEXT`/`PREV` delegate to `getNavigatedDate`.
 *
 * @param state - Current calendar state.
 * @param action - Action to apply.
 * @returns Next calendar state.
 */
export function calendarReducer(
  state: CalendarState,
  action: CalendarAction,
): CalendarState {
  switch (action.type) {
    case CALENDAR_ACTIONS.SET_DATE:
      return {
        ...state,
        selectedDate: action.payload,
        scheduleExtraDays: 0,
      };
    case CALENDAR_ACTIONS.SET_VIEW:
      return { ...state, view: action.payload, scheduleExtraDays: 0 };
    case CALENDAR_ACTIONS.SET_CUSTOM_DAYS:
      return { ...state, customDays: action.payload };
    case CALENDAR_ACTIONS.NEXT:
      return {
        ...state,
        selectedDate: getNavigatedDate(state, 1),
        scheduleExtraDays: 0,
      };
    case CALENDAR_ACTIONS.PREV:
      return {
        ...state,
        selectedDate: getNavigatedDate(state, -1),
        scheduleExtraDays: 0,
      };
    case CALENDAR_ACTIONS.TODAY:
      return {
        ...state,
        selectedDate: dateFn(),
        scheduleExtraDays: 0,
      };
    case CALENDAR_ACTIONS.EXTEND_SCHEDULE:
      return {
        ...state,
        scheduleExtraDays: state.scheduleExtraDays + action.payload,
      };
    default:
      return state;
  }
}
