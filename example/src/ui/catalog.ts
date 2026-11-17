/**
 * @file What the example app shows and where: every screen key from
 * `screens.ts` with its page title, one-line description, group and the
 * snippet behind "View code".
 */
import { ECalendarViewType } from "../../../src";

export type Group = "views" | "features" | "stories" | "developer";

export interface Entry {
  /** The `screens.ts` key (also the `?screen=` web param). */
  key: string;
  title: string;
  description: string;
  group: Group;
  /** The view "Open in Playground" starts on. */
  view?: ECalendarViewType;
  code: string;
}

const basic = (props: string) =>
  `import Calendar from "calendar-simple-native";\n\n<Calendar\n  events={events}\n${props}/>`;

export const ENTRIES: Entry[] = [
  {
    key: "month",
    title: "Month",
    description: "Bars, +N more, day sheet",
    group: "views",
    view: ECalendarViewType.month,
    code: basic("  selectedDate={new Date(2026, 9, 22)}\n  creatable\n"),
  },
  {
    key: "week",
    title: "Week",
    description: "Time grid, all-day row",
    group: "views",
    view: ECalendarViewType.week,
    code: basic('  view="week"\n  showAllDayRow\n'),
  },
  {
    key: "day",
    title: "Day",
    description: "Now-line, overlaps",
    group: "views",
    view: ECalendarViewType.day,
    code: basic('  view="day"\n  showCurrentTime\n'),
  },
  {
    key: "customDays",
    title: "3 Days",
    description: "Custom day count",
    group: "views",
    view: ECalendarViewType.customDays,
    code: basic('  view="customDays"\n  customDays={3}\n'),
  },
  {
    key: "schedule",
    title: "Schedule",
    description: "Agenda, pull to refresh",
    group: "views",
    view: ECalendarViewType.schedule,
    code: basic(
      '  view="schedule"\n  onRefresh={refresh}\n  onEndReached={loadMore}\n',
    ),
  },
  {
    key: "customization",
    title: "Theming & dark mode",
    description: "Palette, theme states, styles and schemes",
    group: "features",
    code: basic(
      '  colorScheme="dark"\n  palette={{ light: { primary: "#7c3aed" } }}\n',
    ),
  },
  {
    key: "localization",
    title: "Locales & RTL",
    description: "Intl formatting, week start and right-to-left",
    group: "features",
    code: basic('  locale="ar"\n  weekStartsOn="locale"\n'),
  },
  {
    key: "recurring",
    title: "Recurring events",
    description: "Weekly, monthly and yearly rules with skipped dates",
    group: "features",
    code: `import Calendar from "calendar-simple-native";

const events = [
  {
    id: "standup",
    title: "Standup",
    startDate: "2026-10-05T09:30:00",
    endDate: "2026-10-05T09:45:00",
    rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    exdates: ["2026-10-16"],
  },
];

<Calendar
  events={events}
  onEventClick={(e) => console.log(e.recurringEventId, e.occurrenceDate)}
/>`,
  },
  {
    key: "drag",
    title: "Gestures",
    description:
      "Move and resize events with a long press; pinch to zoom; haptics",
    group: "features",
    view: ECalendarViewType.week,
    code: `import * as Haptics from "expo-haptics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Calendar from "calendar-simple-native";
import { CalendarGestures } from "calendar-simple-native/gestures";

<GestureHandlerRootView style={{ flex: 1 }}>
  <CalendarGestures>
    <Calendar
      events={events}
      view="week"
      draggable
      onEventDrop={({ event, start, end }) => update(event.id, start, end)}
      resizable
      onEventResize={({ event, start, end }) => update(event.id, start, end)}
      onHaptic={(kind) =>
        kind === "snap"
          ? Haptics.selectionAsync()
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      pinchToZoom
    />
  </CalendarGestures>
</GestureHandlerRootView>`,
  },
  {
    key: "features",
    title: "Loading & empty states",
    description: "Loading, empty data, callbacks and more props",
    group: "features",
    code: basic("  isLoading={loading}\n"),
  },
  {
    key: "header",
    title: "Header",
    description: "Built-in header and view picker",
    group: "stories",
    code: basic("  renderHeader={(props) => <MyHeader {...props} />}\n"),
  },
  {
    key: "timeFormatting",
    title: "Time formatting",
    description: "12 and 24 hour clocks per locale",
    group: "stories",
    code: basic('  is12Hour="locale"\n'),
  },
  {
    key: "interactions",
    title: "Interactions",
    description: "Press, long press and slot creation",
    group: "stories",
    code: basic('  creatable\n  slotPressMode="longPress"\n'),
  },
  {
    key: "accessibility",
    title: "Accessibility",
    description: "Labels, roles and font scaling",
    group: "stories",
    code: basic("  maxFontSizeMultiplier={1.5}\n"),
  },
  {
    key: "intl",
    title: "Intl check",
    description: "What the JS engine's Intl supports",
    group: "developer",
    code: "Intl.DateTimeFormat().resolvedOptions();",
  },
  {
    key: "pager",
    title: "Pager probe",
    description: "One swipe moves one period",
    group: "developer",
    code: basic("  swipeNavigation\n"),
  },
  {
    key: "perf",
    title: "Performance",
    description: "Render and scroll timings on large data",
    group: "developer",
    code: basic("  eventsAreSorted\n"),
  },
  {
    key: "edgeCases",
    title: "Edge cases",
    description: "QA: DST, boundaries and odd titles",
    group: "developer",
    code: basic(""),
  },
  {
    key: "layoutLimits",
    title: "Layout limits",
    description: "QA: tiny and huge containers",
    group: "developer",
    code: basic("  width={280}\n  height={320}\n"),
  },
];

export function entry(key: string | null): Entry | undefined {
  return ENTRIES.find((e) => e.key === key);
}

export const inGroup = (group: Group) =>
  ENTRIES.filter((e) => e.group === group);
