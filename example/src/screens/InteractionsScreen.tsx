/**
 * @file Parity with web `QA/Interactions.stories.tsx`.
 */
import { useState } from "react";
import { Text, View } from "react-native";
import Calendar, {
  ECalendarViewType,
  type CalendarEvent,
  type CalendarProps,
} from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { at, today } from "../fixtures/storyEvents";

const events: CalendarEvent[] = [
  {
    id: "interact-1",
    title: "Clickable Event",
    startDate: at(10),
    endDate: at(11),
    style: { backgroundColor: "#8B5CF6" },
  },
];
const base: CalendarProps = {
  view: ECalendarViewType.week,
  selectable: true,
  events,
};

function Controlled(props: CalendarProps) {
  const [date, setDate] = useState(today.toJSDate());
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ padding: 8, fontWeight: "600" }}>
        Controlled date: {date.toDateString()}
      </Text>
      <Calendar
        {...props}
        selectedDate={date}
        onDateClick={setDate}
        onNavigate={setDate}
      />
    </View>
  );
}

const SCENARIOS: Scenario[] = [
  {
    name: "Callbacks + selectable",
    props: (log) => ({
      ...base,
      onDateClick: (d) => log(`onDateClick ${d.toDateString()}`),
      onEventClick: (e) => log(`onEventClick ${e.title}`),
      onEventLongPress: (e) => log(`onEventLongPress ${e.title}`),
      onNavigate: (d) => log(`onNavigate ${d.toDateString()}`),
      onViewChange: (v) => log(`onViewChange ${v}`),
    }),
  },
  {
    name: "Not selectable",
    props: (log) => ({
      ...base,
      selectable: false,
      onDateClick: () => log("SHOULD NOT FIRE: onDateClick"),
      onEventClick: (e) => log(`onEventClick ${e.title}`),
    }),
  },
  {
    name: "Controlled state",
    props: () => base,
    render: (props) => <Controlled {...props} />,
  },
  {
    name: "Long-press slots",
    props: (log) => ({
      ...base,
      creatable: true,
      slotPressMode: "longPress",
      onSlotClick: (s) => log(`onSlotClick ${s.toLocaleString()}`),
    }),
  },
  {
    name: "No swipe",
    props: () => ({ ...base, swipeNavigation: false }),
  },
  {
    name: "Popover off",
    props: (log) => ({
      ...base,
      view: ECalendarViewType.month,
      maxEvents: 1,
      events: [
        ...events,
        { id: "2", title: "Second", startDate: at(12), endDate: at(13) },
      ],
      showMorePopover: false,
      onMoreClick: (d, hidden) =>
        log(`onMoreClick ${d.toDateString()}: ${hidden.length} hidden`),
    }),
  },
];

export default function InteractionsScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
