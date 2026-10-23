/**
 * @file Parity with web `Features.stories.tsx`.
 */
import { Text, View } from "react-native";
import Calendar, { ECalendarViewType } from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { at, featureEvents, today } from "../fixtures/storyEvents";

const base = {
  events: featureEvents,
  selectedDate: today.toJSDate(),
};
const fmt = (d: Date) => d.toLocaleDateString();

const SCENARIOS: Scenario[] = [
  {
    name: "12-hour",
    props: () => ({ ...base, view: ECalendarViewType.week, is12Hour: true }),
  },
  {
    name: "24-hour",
    props: () => ({ ...base, view: ECalendarViewType.week, is12Hour: false }),
  },
  {
    name: "Interactive events",
    props: (log) => ({
      ...base,
      onEventClick: (e) => log(`Event clicked: ${e.title} (id ${e.id})`),
      onEventLongPress: (e) => log(`Event long-pressed: ${e.title}`),
    }),
  },
  {
    name: "Interactive dates",
    props: (log) => ({
      ...base,
      selectable: true,
      onDateClick: (d) => log(`Date clicked: ${fmt(d)}`),
    }),
  },
  {
    name: "Navigation callback",
    props: (log) => ({
      ...base,
      onNavigate: (d) => log(`Navigated to: ${fmt(d)}`),
      onViewChange: (v) => log(`Switched to view: ${v}`),
      onDateRangeChange: (s, e, v) =>
        log(`Range (${v}): ${fmt(s)} – ${fmt(e)}`),
    }),
  },
  {
    name: "Max events",
    props: (log) => ({
      ...base,
      maxEvents: 2,
      onMoreClick: (d, hidden) =>
        log(`More for ${fmt(d)}: ${hidden.length} hidden`),
    }),
  },
  {
    name: "Custom theming",
    props: () => ({
      ...base,
      theme: {
        default: { color: "#333", bgColor: "#f0f0f0" },
        today: { color: "#fff", bgColor: "#ff0000" },
        selected: { color: "#fff", bgColor: "#0000ff" },
      },
    }),
  },
  {
    name: "Auto-scroll to now",
    props: () => ({
      ...base,
      view: ECalendarViewType.day,
      autoScrollToCurrentTime: true,
      showCurrentTime: true,
    }),
  },
  {
    name: "Adjacent months on",
    props: () => ({ ...base, showAdjacentMonths: true }),
  },
  {
    name: "Adjacent months off",
    props: () => ({ ...base, showAdjacentMonths: false }),
  },
  {
    name: "Create (time grid)",
    props: (log) => ({
      ...base,
      view: ECalendarViewType.week,
      creatable: true,
      onSlotClick: (s, e) =>
        log(`Create: ${s.toLocaleTimeString()} – ${e.toLocaleTimeString()}`),
    }),
  },
  {
    name: "Create (month)",
    props: (log) => ({
      ...base,
      creatable: true,
      onSlotClick: (s) => log(`Create all-day event on: ${fmt(s)}`),
    }),
  },
  {
    name: "Create + selectable",
    props: (log) => ({
      ...base,
      selectable: true,
      creatable: true,
      onDateClick: (d) => log(`Date selected: ${fmt(d)}`),
      onSlotClick: (s) => log(`Create event on: ${fmt(s)}`),
    }),
  },
  {
    name: "Compound components",
    props: () => base,
    render: (props) => (
      <Calendar {...props}>
        <View
          style={{
            flex: 1,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: "#ccc",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <Calendar.Header />
          <Calendar.MonthView />
        </View>
      </Calendar>
    ),
  },
  ...(["month", "week", "day", "schedule"] as const).map((view): Scenario => ({
    name: `Loading (${view})`,
    props: () => ({ isLoading: true, events: [], view }),
  })),
  {
    name: "Loading with events",
    props: () => ({
      isLoading: true,
      events: [
        {
          id: "1",
          title: "Existing meeting",
          startDate: at(10),
          endDate: at(11),
        },
      ],
    }),
  },
  {
    name: "Custom renderLoading",
    props: () => ({
      isLoading: true,
      events: [],
      renderLoading: () => (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, color: "#6b7280" }}>
            Fetching your calendar…
          </Text>
        </View>
      ),
    }),
  },
  {
    name: "Reset date on view change",
    props: (log) => ({
      ...base,
      selectedDate: today.plus({ months: 3 }).toJSDate(),
      resetDateOnViewChange: true,
      onNavigate: (d) => log(`onNavigate: ${fmt(d)}`),
    }),
  },
  {
    name: "testID prop",
    props: () => ({
      ...base,
      view: ECalendarViewType.week,
      testID: "team-calendar",
    }),
  },
];

export default function FeaturesScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
