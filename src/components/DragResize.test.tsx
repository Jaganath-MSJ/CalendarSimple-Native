import type { ReactElement } from "react";
import { View } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "./Calendar";
import {
  GestureAdapterProvider,
  type DragWrapperProps,
} from "../context/GestureAdapterContext";
import type { CalendarEvent, EventResizeInfo } from "../types";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const wrapped = new Map<string, DragWrapperProps>();
function FakeWrapper(props: DragWrapperProps) {
  const id = (props.children as ReactElement<{ testID?: string }>).props.testID;
  if (id) wrapped.set(id, props);
  return <View style={props.style}>{props.children}</View>;
}
const ADAPTER = { EventWrapper: FakeWrapper };
beforeEach(() => wrapped.clear());

const oct22 = new Date(2026, 9, 22);
const meeting: CalendarEvent = {
  id: "m",
  title: "Meeting",
  startDate: "2026-10-22T09:00:00",
  endDate: "2026-10-22T10:00:00",
};
const item = "calendar-m-day-event-item";
type Resize = EventResizeInfo<CalendarEvent>;
const hm = (d: Date) => DateTime.fromJSDate(d).toFormat("HH:mm");

function day(props: Partial<Parameters<typeof Calendar>[0]> = {}) {
  return (
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        resizable
        onEventResize={() => {}}
        {...props}
      />
    </GestureAdapterProvider>
  );
}

async function resize(edge: "top" | "bottom", dy: number) {
  const props = wrapped.get(item)!;
  await act(() => {
    props.onDragStart();
    props.resize!.onEnd(edge, dy);
  });
}

it("gives both edges, in resizeSnapMinutes steps and inside the grid", async () => {
  await renderCalendar(day());
  const { resize: r, move } = wrapped.get(item)!;
  expect(move).toBeUndefined(); // resizable only
  // 60 px per hour: 15 px steps; 15 min minimum = 15 px.
  expect(r).toMatchObject({
    snapY: 15,
    top: { min: -540, max: 45 },
    bottom: { min: -45, max: 24 * 60 - 600 },
  });
});

it("reports the new end, or start, with the edge", async () => {
  const onEventResize = jest.fn<void, [Resize]>();
  await renderCalendar(day({ onEventResize }));
  await resize("bottom", 30);
  await resize("top", -45);
  const [b, t] = onEventResize.mock.calls.map((c) => c[0]);
  expect([hm(b!.start), hm(b!.end), b!.edge, b!.view]).toEqual([
    "09:00",
    "10:30",
    "bottom",
    "day",
  ]);
  expect([hm(t!.start), hm(t!.end), t!.edge]).toEqual([
    "08:15",
    "10:00",
    "top",
  ]);
});

it("never goes below minEventDurationMinutes", async () => {
  const onEventResize = jest.fn<void, [Resize]>();
  await renderCalendar(
    day({ onEventResize, minEventDurationMinutes: 30, resizeSnapMinutes: 10 }),
  );
  const r = wrapped.get(item)!.resize!;
  expect(r.snapY).toBe(10);
  expect(r.bottom!.min).toBe(-30);
  await resize("bottom", -60);
  expect(hm(onEventResize.mock.calls[0]![0].end)).toBe("09:30");
});

it("an event shorter than the minimum: a jiggle never resizes it", async () => {
  // 10 minutes long, 30-minute minimum: neither edge may move inwards.
  const onEventResize = jest.fn<void, [Resize]>();
  await renderCalendar(
    day({
      onEventResize,
      minEventDurationMinutes: 30,
      events: [{ ...meeting, endDate: "2026-10-22T09:10:00" }],
    }),
  );
  const r = wrapped.get(item)!.resize!;
  expect(r.top!.max).toBe(0);
  expect(r.bottom!.min).toBe(0);
  // Outwards still works.
  expect(r.top!.min).toBeLessThan(0);
  expect(r.bottom!.max).toBeGreaterThan(0);
  await resize("bottom", 0);
  expect(onEventResize).not.toHaveBeenCalled();
});

it("does nothing for an unchanged edge", async () => {
  const onEventResize = jest.fn();
  await renderCalendar(day({ onEventResize }));
  await resize("bottom", 0);
  expect(onEventResize).not.toHaveBeenCalled();
});

it("moves and resizes together when both are on", async () => {
  await renderCalendar(day({ draggable: true, onEventDrop: () => {} }));
  const props = wrapped.get(item)!;
  expect(props.move).toBeDefined();
  expect(props.resize).toBeDefined();
});

it("offers no edge that is outside the column", async () => {
  await renderCalendar(
    day({
      events: [
        {
          id: "m",
          title: "Night shift",
          startDate: "2026-10-21T22:00:00",
          endDate: "2026-10-22T06:00:00",
        },
      ],
    }),
  );
  // On 22 Oct the event starts before the column: only the bottom resizes.
  const r = wrapped.get(item)!.resize!;
  expect(r.top).toBeUndefined();
  expect(r.bottom).toBeDefined();
});

it("does not resize all-day events, or without onEventResize", async () => {
  await renderCalendar(
    day({
      view: "week",
      events: [meeting, { id: "a", title: "All day", startDate: "2026-10-22" }],
    }),
  );
  expect(wrapped.has(item)).toBe(true);
  wrapped.clear();
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar view="day" selectedDate={oct22} events={[meeting]} resizable />
    </GestureAdapterProvider>,
  );
  expect(wrapped.size).toBe(0);
});

it("asks a resizable function per event", async () => {
  await renderCalendar(
    day({
      events: [meeting, { ...meeting, id: "x", title: "Fixed" }],
      resizable: (e) => e.id !== "x",
    }),
  );
  expect(wrapped.has(item)).toBe(true);
  expect(wrapped.has("calendar-x-day-event-item")).toBe(false);
});

it("screen-reader actions lengthen and shorten, without the gestures entry", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  const onEventResize = jest.fn<void, [Resize]>();
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={oct22}
      events={[meeting]}
      resizable
      onEventResize={onEventResize}
    />,
  );
  const el = screen.getByTestId(item);
  expect(
    (el.props.accessibilityActions as { label: string }[]).map((a) => a.label),
  ).toEqual(["Make 15 minutes longer", "Make 15 minutes shorter"]);
  await fireEvent(el, "accessibilityAction", {
    nativeEvent: { actionName: "makeLonger" },
  });
  await fireEvent(el, "accessibilityAction", {
    nativeEvent: { actionName: "makeShorter" },
  });
  expect(onEventResize.mock.calls.map((c) => hm(c[0].end))).toEqual([
    "10:15",
    "09:45",
  ]);
});
