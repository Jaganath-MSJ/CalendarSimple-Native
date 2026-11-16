/**
 * @file Moving events: long-press an event and drag it (`draggable`,
 * `onEventDrop`, `<CalendarGestures>`). The screen owns the events and
 * applies each drop, as an app would.
 */
import { useCallback, useState } from "react";
import { DateTime } from "luxon";
import Calendar, {
  ECalendarViewType,
  type CalendarEvent,
  type EventDropInfo,
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
    title: "Locked (not draggable)",
    startDate: "2026-10-22T15:00:00",
    endDate: "2026-10-22T16:00:00",
    style: { backgroundColor: "#4b5563" },
  },
];

/** The new start and end in the event's own format (date-only or local time). */
function moved(event: CalendarEvent, info: EventDropInfo): CalendarEvent {
  const fmt = info.allDay ? "yyyy-MM-dd" : "yyyy-MM-dd'T'HH:mm:ss";
  return {
    ...event,
    startDate: DateTime.fromJSDate(info.start).toFormat(fmt),
    ...(event.endDate
      ? { endDate: DateTime.fromJSDate(info.end).toFormat(fmt) }
      : {}),
  };
}

export default function DragScreen() {
  const [events, setEvents] = useState(INITIAL);
  const onDrop = useCallback(
    (info: EventDropInfo, log: (m: string) => void) => {
      setEvents((list) =>
        list.map((e) => (e.id === info.event.id ? moved(e, info) : e)),
      );
      log(
        `${info.event.title} → ${DateTime.fromJSDate(info.start).toFormat("ccc d LLL HH:mm")} (${info.view})`,
      );
    },
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
