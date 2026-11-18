/**
 * @file Gestures: long-press an event and drag it, or long-press near its
 * top or bottom edge and drag that edge; pinch the hours to zoom
 * (`draggable`, `onEventDrop`, `resizable`, `onEventResize`,
 * `pinchToZoom`, `onHaptic`, `<CalendarGestures>`). The screen owns the
 * events and applies each change, as an app would.
 */
import { useCallback, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { DateTime } from "luxon";
import Calendar, {
  ECalendarViewType,
  type CalendarEvent,
  type EventDropInfo,
  type HapticKind,
  type EventResizeInfo,
} from "../../../src";
import { CalendarGestures } from "../../../src/gestures";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { DEMO_DATE } from "../fixtures/demoEvents";

const INITIAL: CalendarEvent[] = [
  {
    id: "review",
    title: "Design review",
    startDate: "2026-10-22T10:00:00",
    endDate: "2026-10-22T11:00:00",
  },
  {
    id: "lunch",
    title: "Lunch with Priya",
    startDate: "2026-10-21T12:30:00",
    endDate: "2026-10-21T13:30:00",
    style: { backgroundColor: "#15803d" },
  },
  {
    id: "focus",
    title: "Focus time",
    startDate: "2026-10-23T14:00:00",
    endDate: "2026-10-23T16:00:00",
    style: { backgroundColor: "#7e22ce" },
  },
  {
    id: "release",
    title: "Release",
    startDate: "2026-10-20",
    style: { backgroundColor: "#c2410c" },
  },
  {
    id: "locked",
    title: "Locked",
    startDate: "2026-10-22T15:00:00",
    endDate: "2026-10-22T16:00:00",
    style: { backgroundColor: "#4b5563" },
  },
];

/** The calendar says when; the app picks the feedback (expo-haptics). */
function haptic(kind: HapticKind) {
  switch (kind) {
    case "lift":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case "snap":
      return Haptics.selectionAsync();
    case "drop":
    case "resize":
      return Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    case "cancel":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** The new start and end in the event's own format (date-only or local time). */
function moved(
  event: CalendarEvent,
  info: EventDropInfo | EventResizeInfo,
): CalendarEvent {
  const fmt =
    "allDay" in info && info.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm:ss";
  return {
    ...event,
    startDate: DateTime.fromJSDate(info.start).toFormat(fmt),
    ...(event.endDate || "edge" in info
      ? { endDate: DateTime.fromJSDate(info.end).toFormat(fmt) }
      : {}),
  };
}

/** "lift, 4 snaps, drop": a drag's haptics for the log line. */
function summary(kinds: HapticKind[]): string {
  const snaps = kinds.filter((k) => k === "snap").length;
  const rest = kinds.filter((k) => k !== "snap");
  const parts = [rest[0], snaps ? `${snaps} snap${snaps > 1 ? "s" : ""}` : ""];
  return [
    "haptics:",
    parts.concat(rest.slice(1)).filter(Boolean).join(", "),
  ].join(" ");
}

export default function DragScreen() {
  const [events, setEvents] = useState(INITIAL);
  // Haptics of the drag in progress, shown with its result.
  const kinds = useRef<HapticKind[]>([]);
  const takeHaptics = () => {
    const text = kinds.current.length ? ` · ${summary(kinds.current)}` : "";
    kinds.current = [];
    return text;
  };
  const onDrop = useCallback(
    (info: EventDropInfo, log: (m: string) => void) => {
      setEvents((list) =>
        list.map((e) => (e.id === info.event.id ? moved(e, info) : e)),
      );
      log(
        `${info.event.title} → ${DateTime.fromJSDate(info.start).toFormat("ccc d LLL HH:mm")} (${info.view})${takeHaptics()}`,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads a ref
    [],
  );

  const onResize = useCallback(
    (info: EventResizeInfo, log: (m: string) => void) => {
      setEvents((list) =>
        list.map((e) => (e.id === info.event.id ? moved(e, info) : e)),
      );
      const t = (d: Date) => DateTime.fromJSDate(d).toFormat("HH:mm");
      log(
        `${info.event.title} ⇕ ${t(info.start)}–${t(info.end)} (${info.edge})${takeHaptics()}`,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads a ref
    [],
  );

  const scenario = (name: string, view?: ECalendarViewType): Scenario => ({
    name,
    props: (log) => ({
      events,
      selectedDate: DEMO_DATE,
      view,
      customDays: view === ECalendarViewType.customDays ? 3 : undefined,
      draggable: (e) => e.id !== "locked",
      onEventDrop: (info) => onDrop(info, log),
      // Like an app that opens the event: a drag must not also be a click.
      onEventClick: (e) => log(`Opened ${e.title}`),
      resizable: (e) => e.id !== "locked",
      onEventResize: (info) => onResize(info, log),
      onHaptic: (kind) => {
        void haptic(kind);
        if (kind === "lift") kinds.current = [];
        kinds.current.push(kind);
        // A cancelled drag has no drop line to show them on.
        if (kind === "cancel") log(`No change${takeHaptics()}`);
      },
      pinchToZoom: true,
      onHourHeightChange: (h) => log(`Hour height: ${h}`),
    }),
    render: (props) => (
      <CalendarGestures>
        <Calendar {...props} />
      </CalendarGestures>
    ),
  });

  return (
    <ScenarioScreen
      scenarios={[
        scenario("Week", ECalendarViewType.week),
        scenario("Day", ECalendarViewType.day),
        scenario("3 Days", ECalendarViewType.customDays),
        scenario("Month"),
      ]}
    />
  );
}
