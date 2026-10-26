/**
 * @file Parity with web `QA/TimeFormatting.stories.tsx`.
 */
import {
  ECalendarViewType,
  type CalendarEvent,
  type CalendarProps,
} from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { at, today } from "../fixtures/storyEvents";

const events: CalendarEvent[] = [
  {
    id: "1",
    title: "Afternoon Event",
    startDate: at(14),
    endDate: at(15),
    style: { backgroundColor: "#F59E0B" },
  },
];

const story = (name: string, props: CalendarProps): Scenario => ({
  name,
  props: () => ({
    view: ECalendarViewType.day,
    selectedDate: today.toJSDate(),
    ...props,
  }),
});

const SCENARIOS: Scenario[] = [
  story("12-hour", { events, is12Hour: true }),
  story("24-hour", { events, is12Hour: false }),
  story("Locale hour cycle", { events, is12Hour: "locale" }),
  story("Show current time", { events, showCurrentTime: true }),
  story("Hide current time", { events, showCurrentTime: false }),
  story("Auto-scroll on", { events: [], autoScrollToCurrentTime: true }),
  story("Auto-scroll off", { events: [], autoScrollToCurrentTime: false }),
];

export default function TimeFormattingScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
