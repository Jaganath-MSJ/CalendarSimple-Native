/**
 * @file User-visible strings and accessibility labels (TDD §6.5).
 */

/** Every string the calendar shows or announces. Parameterised messages are functions. */
export interface CalendarMessages {
  today: string;
  day: string;
  week: string;
  month: string;
  schedule: string;
  days: string;
  /** "All day" */
  allDay: string;
  /** "Until" */
  until: string;
  /** "No events to display" */
  noEvents: string;
  /** "No title" — accessibility label only (#14C) */
  noTitle: string;
  /** "New event" */
  newEvent: string;
  /** "Loading events" */
  loading: string;
  /** "Previous period" */
  previous: string;
  /** "Next period" */
  next: string;
  selectView: string;
  selectMonth: string;
  selectYear: string;
  calendarNavigation: string;
  allDayEvents: string;
  expandAllDay: string;
  collapseAllDay: string;
  close: string;
  weekView: string;
  dayView: string;
  scheduleView: string;
  /** "3 days view" */
  nDaysView: (n: number) => string;
  /** "1 event", "9 events"; "no events" for 0 */
  eventCount: (n: number) => string;
  /** "+ 3 more" */
  more: (n: number) => string;
  /** "3 more all-day events, tap to expand" */
  moreAllDay: (n: number) => string;
  /** "(Day 1/3)" */
  dayOfTotal: (i: number, n: number) => string;
  /** "Events on Thu, 22 Oct" */
  eventsOn: (date: string) => string;
  /** "Create event at 14:00, Thu 22 Oct" */
  createEventAt: (time: string, date: string) => string;
}

/** English defaults for every message. */
export const DEFAULT_MESSAGES: CalendarMessages = {
  today: "Today",
  day: "Day",
  week: "Week",
  month: "Month",
  schedule: "Schedule",
  days: "Days",
  allDay: "All day",
  until: "Until",
  noEvents: "No events to display",
  noTitle: "No title",
  newEvent: "New event",
  loading: "Loading events",
  previous: "Previous period",
  next: "Next period",
  selectView: "Select calendar view",
  selectMonth: "Select month",
  selectYear: "Select year",
  calendarNavigation: "Calendar navigation",
  allDayEvents: "All-day events",
  expandAllDay: "Expand all-day events",
  collapseAllDay: "Collapse all-day events",
  close: "Close",
  weekView: "Week view",
  dayView: "Day view",
  scheduleView: "Schedule view",
  nDaysView: (n) => `${n} days view`,
  eventCount: (n) =>
    n === 0 ? "no events" : n === 1 ? "1 event" : `${n} events`,
  more: (n) => `+ ${n} more`,
  moreAllDay: (n) => `${n} more all-day events, tap to expand`,
  dayOfTotal: (i, n) => `(Day ${i}/${n})`,
  eventsOn: (d) => `Events on ${d}`,
  createEventAt: (t, d) => `Create event at ${t}, ${d}`,
};

/**
 * Merges partial overrides over `DEFAULT_MESSAGES` key by key; `undefined`
 * values fall back to the default.
 */
export function resolveMessages(
  partial?: Partial<CalendarMessages>,
): CalendarMessages {
  if (!partial) return DEFAULT_MESSAGES;
  const out: Record<string, unknown> = { ...DEFAULT_MESSAGES };
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) out[key] = value;
  }
  return out as unknown as CalendarMessages;
}
