/**
 * @file Layout result types produced by the core layout functions (TDD §7.1).
 */
import type { DateType } from "./date";
import type { BaseCalendarEvent, EventListType } from "./events";

/** Information for a single day in the month grid. */
export interface CalendarDayInfo<
  E extends BaseCalendarEvent = BaseCalendarEvent,
> {
  /** The full date object. */
  currentDate: DateType;
  /** Whether the day belongs to the currently selected month. */
  isCurrentMonth: boolean;
  /** The day number to display (1-31). */
  displayDay: number;
  /** List of events or spacers for this day's slots. */
  events: (EventListType<E> | null)[];
  /** Total number of events on this day (including hidden ones). */
  totalEvents: number;
  /** Today AND in the shown month (web semantics). */
  isToday: boolean;
  /** Today but in an adjacent month (#17C). */
  isTodayAdjacent: boolean;
}

/** 2D array representing the month grid: [week][day]. */
export type CalendarMatrix<E extends BaseCalendarEvent = BaseCalendarEvent> =
  CalendarDayInfo<E>[][];

/** One all-day banner chip placed on a row. */
export interface BannerLayoutEvent<
  E extends BaseCalendarEvent = BaseCalendarEvent,
> {
  event: E;
  startIndex: number;
  endIndex: number;
  isClippedLeft: boolean;
  isClippedRight: boolean;
  row: number;
}

/** Result of the all-day banner layout. */
export interface BannerLayout<E extends BaseCalendarEvent = BaseCalendarEvent> {
  layoutEvents: BannerLayoutEvent<E>[];
  visibleLayoutEvents: BannerLayoutEvent<E>[];
  rowCount: number;
  effectiveMaxRows: number;
  hiddenCounts: number[];
  hasHiddenEvents: boolean;
  containerHeight: number;
  showExpandCollapse: boolean;
}

/**
 * A timed event placed in a day column.
 * `top`/`height` are minutes from `minHour`; `left`/`width` are percentages (4 decimals).
 */
export interface DayEventLayout<
  E extends BaseCalendarEvent = BaseCalendarEvent,
> {
  event: E;
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

/** Events of one Schedule day. */
export interface ScheduleGroup<
  E extends BaseCalendarEvent = BaseCalendarEvent,
> {
  dateKey: string;
  date: DateType;
  events: E[];
}

/** Visible days of a view; both ends inclusive. */
export interface VisibleRange {
  start: DateType;
  end: DateType;
}
