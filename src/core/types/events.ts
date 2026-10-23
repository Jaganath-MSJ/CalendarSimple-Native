/**
 * @file Core event type definitions for the calendar.
 */

/**
 * Represents a single calendar event. Platform-free: the React Native layer
 * adds a `style` field on top of this (`CalendarEvent`).
 */
export interface BaseCalendarEvent {
  /** Unique identifier for the event. Used for deduplication and React keying. */
  id?: string;
  /** ISO 8601 start date. Use `YYYY-MM-DD` for all-day events, `YYYY-MM-DDTHH:mm:ss` for timed events. */
  startDate: string;
  /**
   * ISO 8601 end date. Omit for single-day events; set to a later date for multi-day
   * spanning events. If set to a date before `startDate`, the event is silently filtered
   * by `validateEvents` (negative-duration guard, C-TC3). A date-only end is inclusive.
   */
  endDate?: string;
  /** Display title shown on the event chip. */
  title: string;
  /** Allows arbitrary custom fields to be attached and accessed in custom renderers. */
  [key: string]: unknown;
}

/**
 * Internal enriched event type used by layout algorithms.
 * Extends the event with week-boundary clipping fields, or marks the slot as a spacer
 * to preserve grid positions when events overflow the visible row limit.
 */
export type EventListType<E extends BaseCalendarEvent = BaseCalendarEvent> =
  | (E & {
      startDateWeek: string;
      endDateWeek?: string;
      isSpacer?: false;
    })
  | (E & { isSpacer: true });
