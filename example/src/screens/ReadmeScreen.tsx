/**
 * @file The README GIFs' calendars (`?screen=readme-<demo>`, not in the
 * menus): one plain calendar filling the screen with neutral sample events
 * and no example chrome. `scripts/readme-gifs/record.sh` records them on
 * the iOS simulator.
 *
 * - `views`: Month, Week, Day and Schedule, one after another
 * - `drag`: Week view with `draggable` and `resizable` ("Team sync" is the
 *   event the recording moves and resizes)
 * - `theme`: Month view, light then dark
 * - `locale`: Month view in English, German and Arabic (right to left)
 */
import { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { DateTime } from "luxon";
import { StatusBar } from "expo-status-bar";
import Calendar, {
  ECalendarViewType,
  type CalendarEvent,
  type CalendarMessages,
  type EventDropInfo,
  type EventResizeInfo,
} from "../../../src";
import { CalendarGestures } from "../../../src/gestures";
import { PALETTE } from "../../../src/theme/palette";
import { BOTTOM_INSET, TOP_INSET } from "../ui/chrome";

export type ReadmeDemo = "views" | "drag" | "theme" | "locale";

/** Thursday 22 October 2026: every demo shows this week or month. */
const DAY = new Date(2026, 9, 22);
/** How long each step of the self-running demos stays on screen. */
const STEP_MS = 2200;

const at = (day: number, time: string) =>
  `2026-10-${String(day).padStart(2, "0")}T${time}:00`;

/** The week of 22 October, around "Team sync" (the drag demo's event). */
const WEEK_EVENTS: CalendarEvent[] = [
  {
    id: "sync",
    title: "Team sync",
    startDate: at(20, "10:00"),
    endDate: at(20, "11:00"),
  },
  {
    id: "planning",
    title: "Planning",
    startDate: at(19, "09:00"),
    endDate: at(19, "10:30"),
    style: { backgroundColor: "#7c3aed" },
  },
  {
    id: "lunch",
    title: "Lunch",
    startDate: at(21, "13:00"),
    endDate: at(21, "14:00"),
    style: { backgroundColor: "#15803d" },
  },
  {
    id: "workshop",
    title: "Workshop",
    startDate: at(22, "14:00"),
    endDate: at(22, "16:00"),
    style: { backgroundColor: "#c2410c" },
  },
  {
    id: "review",
    title: "Review",
    startDate: at(23, "09:30"),
    endDate: at(23, "10:30"),
    style: { backgroundColor: "#0e7490" },
  },
  {
    id: "conference",
    title: "Conference",
    startDate: "2026-10-22",
    endDate: "2026-10-23",
    style: { backgroundColor: "#7c3aed" },
  },
];

/** The rest of October, so the Month and Schedule views are not empty. */
const MONTH_EVENTS: CalendarEvent[] = [
  ...WEEK_EVENTS,
  {
    id: "m1",
    title: "Kickoff",
    startDate: at(1, "09:00"),
    endDate: at(1, "10:00"),
  },
  {
    id: "m2",
    title: "Design",
    startDate: at(5, "11:00"),
    endDate: at(5, "12:30"),
    style: { backgroundColor: "#7c3aed" },
  },
  {
    id: "m3",
    title: "Release",
    startDate: "2026-10-07",
    style: { backgroundColor: "#c2410c" },
  },
  {
    id: "m4",
    title: "1:1",
    startDate: at(8, "15:00"),
    endDate: at(8, "15:30"),
    style: { backgroundColor: "#0e7490" },
  },
  {
    id: "m5",
    title: "Offsite",
    startDate: "2026-10-12",
    endDate: "2026-10-14",
    style: { backgroundColor: "#15803d" },
  },
  {
    id: "m6",
    title: "Demo",
    startDate: at(16, "16:00"),
    endDate: at(16, "17:00"),
  },
  {
    id: "m7",
    title: "Retro",
    startDate: at(27, "10:00"),
    endDate: at(27, "11:00"),
    style: { backgroundColor: "#7c3aed" },
  },
  {
    id: "m8",
    title: "Training",
    startDate: "2026-10-29",
    style: { backgroundColor: "#0e7490" },
  },
  {
    id: "m9",
    title: "Planning",
    startDate: at(30, "09:00"),
    endDate: at(30, "10:00"),
    style: { backgroundColor: "#c2410c" },
  },
];

const VIEWS = [
  ECalendarViewType.month,
  ECalendarViewType.week,
  ECalendarViewType.day,
  ECalendarViewType.schedule,
];
const SCHEMES = ["light", "dark"] as const;
const LOCALES = ["en", "de", "ar"];
/** Header labels for the localization demo (the names come from `locale`). */
const LOCALE_MESSAGES: Record<string, Partial<CalendarMessages>> = {
  de: {
    today: "Heute",
    month: "Monat",
    week: "Woche",
    day: "Tag",
    schedule: "Termine",
  },
  ar: {
    today: "اليوم",
    month: "شهر",
    week: "أسبوع",
    day: "يوم",
    schedule: "الجدول",
  },
};

/** Steps through `values` every STEP_MS (the self-running demos). */
function useCycle<T>(values: readonly T[], on: boolean): T {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setI((n) => (n + 1) % values.length), STEP_MS);
    return () => clearInterval(id);
  }, [on, values.length]);
  return values[i]!;
}

/** The event with the new start and end from a drop or a resize. */
function moved(
  event: CalendarEvent,
  info: EventDropInfo | EventResizeInfo,
): CalendarEvent {
  const fmt =
    "allDay" in info && info.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm:ss";
  return {
    ...event,
    startDate: DateTime.fromJSDate(info.start).toFormat(fmt),
    endDate: DateTime.fromJSDate(info.end).toFormat(fmt),
  };
}

export default function ReadmeScreen({ demo }: { demo: ReadmeDemo }) {
  const [events, setEvents] = useState(
    demo === "drag" ? WEEK_EVENTS : MONTH_EVENTS,
  );
  const update = useCallback(
    (info: EventDropInfo | EventResizeInfo) =>
      setEvents((list) =>
        list.map((e) => (e.id === info.event.id ? moved(e, info) : e)),
      ),
    [],
  );
  const view = useCycle(VIEWS, demo === "views");
  const scheme = useCycle(SCHEMES, demo === "theme");
  const locale = useCycle(LOCALES, demo === "locale");

  const calendar =
    demo === "drag" ? (
      <CalendarGestures>
        <Calendar
          colorScheme="light"
          view={ECalendarViewType.week}
          selectedDate={DAY}
          events={events}
          minHour={8}
          maxHour={18}
          draggable
          onEventDrop={update}
          resizable
          onEventResize={update}
        />
      </CalendarGestures>
    ) : (
      <Calendar
        colorScheme={scheme}
        view={demo === "views" ? view : ECalendarViewType.month}
        selectedDate={DAY}
        events={events}
        locale={locale}
        localeMessages={LOCALE_MESSAGES[locale]}
        minHour={8}
        maxHour={18}
      />
    );

  return (
    <View style={[styles.root, { backgroundColor: PALETTE[scheme].bg }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {calendar}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === "web" ? 0 : TOP_INSET,
    paddingBottom: Platform.OS === "web" ? 0 : BOTTOM_INSET,
  },
});
