/**
 * @file Parity with web `Accessibility.stories.tsx`. Keyboard stories become
 * screen-reader checks (VoiceOver, TalkBack; Tab + Enter on web).
 */
import { ECalendarViewType } from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { a11yEvents } from "../fixtures/storyEvents";

const SCENARIOS: Scenario[] = [
  {
    name: "Month",
    props: () => ({
      view: ECalendarViewType.month,
      events: a11yEvents,
      selectable: true,
    }),
  },
  {
    name: "Week",
    props: () => ({ view: ECalendarViewType.week, events: a11yEvents }),
  },
  {
    name: "Day creatable slots",
    props: (log) => ({
      view: ECalendarViewType.day,
      events: [],
      creatable: true,
      onSlotClick: (start, end) =>
        log(
          `Slot: ${start.toLocaleTimeString()} – ${end.toLocaleTimeString()}`,
        ),
    }),
  },
  {
    name: "Schedule",
    props: () => ({ view: ECalendarViewType.schedule, events: a11yEvents }),
  },
  {
    name: "Popover (+N more)",
    props: () => ({
      view: ECalendarViewType.month,
      maxEvents: 1,
      events: a11yEvents,
    }),
  },
];

export default function AccessibilityScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
