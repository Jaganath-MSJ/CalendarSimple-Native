/**
 * @file Recurring events (`rrule`, `exdates`): series expanded for the
 * visible range, and the occurrence passed to callbacks.
 */
import { ECalendarViewType, type CalendarEvent } from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { DEMO_DATE } from "../fixtures/demoEvents";

/** Series that start in October 2026 (the example's date). */
const SERIES: CalendarEvent[] = [
  {
    id: "standup",
    title: "Standup",
    startDate: "2026-10-05T09:30:00",
    endDate: "2026-10-05T09:45:00",
    rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    exdates: ["2026-10-16", "2026-11-26"],
  },
  {
    id: "one-on-one",
    title: "1:1 with Sam",
    startDate: "2026-10-06T14:00:00",
    endDate: "2026-10-06T14:30:00",
    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU",
    style: { backgroundColor: "#15803d" },
  },
  {
    id: "demo-day",
    title: "Demo day",
    startDate: "2026-10-30T16:00:00",
    endDate: "2026-10-30T17:00:00",
    rrule: "FREQ=MONTHLY;BYDAY=-1FR",
    style: { backgroundColor: "#7e22ce" },
  },
  {
    id: "payroll",
    title: "Payroll",
    startDate: "2026-10-31",
    rrule: "FREQ=MONTHLY;BYMONTHDAY=-1",
    style: { backgroundColor: "#c2410c" },
  },
  {
    id: "offsite",
    title: "Team offsite",
    startDate: "2026-11-11",
    endDate: "2026-11-13",
    rrule: "FREQ=YEARLY;COUNT=3",
    style: { backgroundColor: "#0369a1" },
  },
];

const base = { events: SERIES, selectedDate: DEMO_DATE };

const describe = (e: CalendarEvent) =>
  e.recurringEventId
    ? `${e.title}: occurrence ${e.occurrenceDate} of series "${e.recurringEventId}" (${e.rrule})`
    : `${e.title} (not recurring)`;

const SCENARIOS: Scenario[] = [
  {
    name: "Month",
    props: (log) => ({ ...base, onEventClick: (e) => log(describe(e)) }),
  },
  {
    name: "Week",
    props: (log) => ({
      ...base,
      view: ECalendarViewType.week,
      onEventClick: (e) => log(describe(e)),
    }),
  },
  {
    name: "Schedule",
    props: (log) => ({
      ...base,
      view: ECalendarViewType.schedule,
      onEventClick: (e) => log(describe(e)),
    }),
  },
];

export default function RecurringScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
