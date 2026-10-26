/**
 * @file Parity with web `QA/EdgeCases.stories.tsx`, plus one scenario per
 * small web test fixture (`TestFixtures.ts`).
 */
import { ECalendarViewType, type CalendarEvent } from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { at, today } from "../fixtures/storyEvents";
import { fixtureList } from "../fixtures/webFixtures";

const selectedDate = today.toJSDate();

const timed = (
  id: string,
  title: string,
  start: [number, number],
  end: [number, number],
  backgroundColor?: string,
): CalendarEvent => ({
  id,
  title,
  startDate: at(...start),
  endDate: at(...end),
  ...(backgroundColor ? { style: { backgroundColor } } : {}),
});

/** Deliberately malformed input; the cast mirrors the web story's `as any`. */
const malformed = [
  { startDate: at(9), endDate: at(10) },
  {
    id: "invalid-date",
    startDate: "fake-date",
    endDate: "fake-date",
    title: "Bad string",
  },
] as unknown as CalendarEvent[];

/** Fixtures that load fast enough for a phone; the 1k/10k sets live on Perf. */
const SMALL_FIXTURES = fixtureList.filter((f) => !f.name.startsWith("Large"));

const SCENARIOS: Scenario[] = [
  {
    name: "Absolute overlap",
    props: () => ({
      view: ECalendarViewType.day,
      selectedDate,
      events: [
        timed("ev1", "Same Time 1", [13, 0], [14, 0], "red"),
        timed("ev2", "Same Time 2", [13, 0], [14, 0], "blue"),
      ],
    }),
  },
  {
    name: "Concurrent stress",
    props: () => ({
      view: ECalendarViewType.day,
      selectedDate,
      events: Array.from({ length: 5 }, (_, i) =>
        timed(
          `concurrent-${i}`,
          `Parallel ${i + 1}`,
          [15, 0],
          [16, 0],
          `hsl(${i * 60}, 70%, 50%)`,
        ),
      ),
    }),
  },
  {
    name: "Nested overlaps",
    props: () => ({
      view: ECalendarViewType.day,
      selectedDate,
      events: [
        timed("outer", "2-Hour Outer", [10, 0], [12, 0], "#d1d5db"),
        timed("inner", "1-Hour Inner", [10, 30], [11, 30], "#3b82f6"),
      ],
    }),
  },
  {
    name: "Overlap offset",
    props: () => ({
      view: ECalendarViewType.day,
      selectedDate,
      eventOverlapOffset: 20,
      events: [
        timed("o1", "Offset Layer 1", [13, 0], [15, 0], "#fca5a5"),
        timed("o2", "Offset Layer 2", [13, 30], [15, 30], "#f87171"),
        timed("o3", "Offset Layer 3", [14, 0], [16, 0], "#ef4444"),
      ],
    }),
  },
  {
    name: "Duration oddities",
    props: () => ({
      view: ECalendarViewType.week,
      selectedDate,
      events: [
        timed(
          "zero-duration",
          "Zero Duration Event",
          [10, 0],
          [10, 0],
          "#f43f5e",
        ),
        timed(
          "negative-duration",
          "Negative Duration (Should ignore/fail safe)",
          [14, 0],
          [12, 0],
          "#8b5cf6",
        ),
        {
          id: "missing-end",
          title: "Missing End Date",
          startDate: at(16),
          style: { backgroundColor: "#10b981" },
        },
      ],
    }),
  },
  {
    name: "Multi-day and overnight",
    props: () => ({
      view: ECalendarViewType.week,
      selectedDate,
      events: [
        {
          id: "md",
          title: "3-Day Stretch",
          startDate: today.toFormat("yyyy-MM-dd"),
          endDate: today.plus({ days: 2 }).toFormat("yyyy-MM-dd"),
          style: { backgroundColor: "#6366f1" },
        },
        {
          id: "on",
          title: "Overnight Switch (10PM to 2AM)",
          startDate: at(22),
          endDate: at(2, 0, 1),
          style: { backgroundColor: "#ec4899" },
        },
      ],
    }),
  },
  {
    name: "Missing data fields",
    props: () => ({
      view: ECalendarViewType.week,
      selectedDate,
      events: malformed,
    }),
  },
  ...SMALL_FIXTURES.map((f): Scenario => ({
    name: `Fixture: ${f.name}`,
    props: () => {
      const events = f.fn();
      const first = events[0]?.startDate;
      return {
        view: ECalendarViewType.month,
        events,
        selectedDate: first ? new Date(first) : selectedDate,
      };
    },
  })),
];

export default function EdgeCasesScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
