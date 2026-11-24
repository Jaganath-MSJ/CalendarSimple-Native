/**
 * @file Calendar state reducer (ported from web `context/CalendarContext.tsx`).
 */
import { dateFn, type DateType } from "../utils/date";
import { clampCustomDays } from "../utils/customDays";
import type { CustomDaysCount, ECalendarViewType } from "../types";
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
  /** Days shown when view is `customDays` (1–7; unset means 3). */
  customDays?: CustomDaysCount;
  /**
   * Bumped by `TODAY` and `SET_DATE` (also to the same date): Schedule scrolls
   * to the selected date on every change (as calendar-simple).
   */
  navigationId: number;
}

/**
 * Union of all dispatchable actions for the calendar reducer.
 * - `SET_DATE` — jump to a specific date
 * - `SET_VIEW` — switch the active view
 * - `NEXT` / `PREV` — advance or retreat by one view-unit (month, week, day, or N custom days)
 * - `TODAY` — reset navigation to today
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
  | { type: typeof CALENDAR_ACTIONS.TODAY };

/** Builds the reducer's initial state (`navigationId: 0`). */
export function createInitialState(
  selectedDate: DateType,
  view: ECalendarViewType,
  customDays?: number,
): CalendarState {
  return {
    selectedDate,
    view,
    customDays:
      customDays === undefined ? undefined : clampCustomDays(customDays),
    navigationId: 0,
  };
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
        navigationId: state.navigationId + 1,
      };
    case CALENDAR_ACTIONS.SET_VIEW:
      return { ...state, view: action.payload };
    case CALENDAR_ACTIONS.SET_CUSTOM_DAYS:
      return {
        ...state,
        customDays:
          action.payload === undefined
            ? undefined
            : clampCustomDays(action.payload),
      };
    case CALENDAR_ACTIONS.NEXT:
    case CALENDAR_ACTIONS.PREV: {
      const next = getNavigatedDate(
        state,
        action.type === CALENDAR_ACTIONS.NEXT ? 1 : -1,
      );
      // Unchanged (Schedule): keep the same state object.
      return next === state.selectedDate
        ? state
        : { ...state, selectedDate: next };
    }
    case CALENDAR_ACTIONS.TODAY:
      return {
        ...state,
        selectedDate: dateFn(),
        navigationId: state.navigationId + 1,
      };
    default:
      return state;
  }
}
