/**
 * @file Parity with web `QA/LayoutLimits.stories.tsx`.
 */
import { ECalendarViewType, type CalendarEvent } from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { at, today } from "../fixtures/storyEvents";

const selectedDate = today.toJSDate();

const heavyAllDayEvents: CalendarEvent[] = Array.from(
  { length: 8 },
  (_, i) => ({
    id: `all-day-${i}`,
    startDate: today.toFormat("yyyy-MM-dd"),
    title: `All Day Event ${i + 1}`,
    style: { backgroundColor: `hsl(${i * 40}, 70%, 50%)` },
  }),
);

const SCENARIOS: Scenario[] = [
  {
    name: "All-day banner limit",
    props: (log) => ({
      view: ECalendarViewType.week,
      selectedDate,
      events: heavyAllDayEvents,
      maxEvents: 3,
      onMoreClick: (d, hidden) =>
        log(`onMoreClick ${d.toDateString()}: ${hidden.length} hidden`),
    }),
  },
  {
    name: "Hide all-day row",
    props: () => ({
      view: ECalendarViewType.week,
      selectedDate,
      events: heavyAllDayEvents,
      showAllDayRow: false,
    }),
  },
  {
    name: "Adjacent months hidden",
    props: () => ({
      view: ECalendarViewType.month,
      selectedDate,
      showAdjacentMonths: false,
    }),
  },
  {
    name: "Work week (Mon–Fri)",
    props: () => ({
      view: ECalendarViewType.week,
      selectedDate,
      weekStartsOn: 1,
      weekEndsOn: 5,
    }),
  },
  {
    name: "Time range 8–18",
    props: () => ({
      view: ECalendarViewType.week,
      selectedDate,
      minHour: 8,
      maxHour: 18,
      events: [
        {
          id: "morning",
          title: "Within Range",
          startDate: at(9),
          endDate: at(10),
        },
        {
          id: "too-early",
          title: "Out of Bounds (Should be hidden or clipped)",
          startDate: at(5),
          endDate: at(6),
          style: { backgroundColor: "red" },
        },
      ],
    }),
  },
  {
    name: "Year list ±1",
    props: () => ({
      view: ECalendarViewType.month,
      selectedDate,
      pastYearLength: 1,
      futureYearLength: 1,
    }),
  },
  {
    name: "Week numbers",
    props: () => ({
      view: ECalendarViewType.month,
      selectedDate,
      showWeekNumbers: true,
      events: heavyAllDayEvents,
    }),
  },
  {
    name: "Fixed 320 × 480",
    props: () => ({
      view: ECalendarViewType.month,
      selectedDate,
      width: 320,
      height: 480,
      events: heavyAllDayEvents,
    }),
  },
];

export default function LayoutLimitsScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
