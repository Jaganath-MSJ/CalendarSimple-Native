import type { ReactElement } from "react";
import { View } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "./Calendar";
import {
  GestureAdapterProvider,
  type DragWrapperProps,
} from "../context/GestureAdapterContext";
import type { CalendarEvent, EventDropInfo } from "../types";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

/** The latest wrapper props, by the wrapped event's test ID. */
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
const offsite: CalendarEvent = {
  id: "o",
  title: "Offsite",
  startDate: "2026-10-13",
  endDate: "2026-10-14",
};

type Drop = EventDropInfo<CalendarEvent>;
const iso = (d: Date) => DateTime.fromJSDate(d).toISO({ includeOffset: false });

async function drop(testID: string, dx: number, dy: number) {
  const props = wrapped.get(testID);
  if (!props) throw new Error(`${testID} is not draggable`);
  await act(() => {
    props.onDragStart();
    props.move!.onEnd(dx, dy);
  });
}

describe("time grids", () => {
  const item = "calendar-m-day-event-item";

  it("moves in dragSnapMinutes steps and keeps the length", async () => {
    const onEventDrop = jest.fn<void, [Drop]>();
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="week"
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={onEventDrop}
        />
      </GestureAdapterProvider>,
    );
    const props = wrapped.get(item)!.move!;
    expect(props.snapY).toBe(15); // 60 px per hour, 15 minutes
    await drop(item, 0, 2 * props.snapY);
    const info = onEventDrop.mock.calls[0]![0];
    expect(iso(info.start)).toBe("2026-10-22T09:30:00.000");
    expect(iso(info.end)).toBe("2026-10-22T10:30:00.000");
    expect(info).toMatchObject({ event: meeting, allDay: false, view: "week" });
  });

  it("moves across day columns, reversed in right-to-left", async () => {
    const onEventDrop = jest.fn<void, [Drop]>();
    const { rerender } = await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="week"
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={onEventDrop}
        />
      </GestureAdapterProvider>,
    );
    const col = wrapped.get(item)!.move!.snapX;
    expect(col).toBeGreaterThan(0);
    // Thursday is the 5th of 7 columns: two to the right, four to the left.
    expect(wrapped.get(item)!.move!.bounds).toMatchObject({
      minX: -4 * col,
      maxX: 2 * col,
    });
    await drop(item, col, 0);
    expect(iso(onEventDrop.mock.calls[0]![0].start)).toBe(
      "2026-10-23T09:00:00.000",
    );
    await rerender(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="week"
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={onEventDrop}
          direction="rtl"
        />
      </GestureAdapterProvider>,
    );
    await drop(item, col, 0);
    expect(iso(onEventDrop.mock.calls[1]![0].start)).toBe(
      "2026-10-21T09:00:00.000",
    );
  });

  it("keeps the event inside the grid, and Day view vertical only", async () => {
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="day"
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={() => {}}
        />
      </GestureAdapterProvider>,
    );
    expect(wrapped.get(item)!.move).toMatchObject({
      snapX: 0,
      bounds: { minX: 0, maxX: 0, minY: -9 * 60, maxY: 24 * 60 - 10 * 60 },
    });
  });

  it("does nothing for a drop back in place", async () => {
    const onEventDrop = jest.fn();
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="day"
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={onEventDrop}
        />
      </GestureAdapterProvider>,
    );
    await drop(item, 0, 0);
    expect(onEventDrop).not.toHaveBeenCalled();
  });

  it("pauses scrolling while an event is dragged", async () => {
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="day"
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={() => {}}
        />
      </GestureAdapterProvider>,
    );
    const scroll = () => screen.getByTestId("calendar-time-grid-scroll");
    expect(scroll().props.scrollEnabled).toBe(true);
    await act(() => wrapped.get(item)!.onDragStart());
    expect(scroll().props.scrollEnabled).toBe(false);
    await act(() => wrapped.get(item)!.onDragCancel());
    expect(scroll().props.scrollEnabled).toBe(true);
  });

  it("asks a draggable function per event, and needs onEventDrop", async () => {
    const other = { ...meeting, id: "x", title: "Locked" };
    const { rerender } = await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="day"
          selectedDate={oct22}
          events={[meeting, other]}
          draggable={(e) => e.id !== "x"}
          onEventDrop={() => {}}
        />
      </GestureAdapterProvider>,
    );
    expect(wrapped.has(item)).toBe(true);
    expect(wrapped.has("calendar-x-day-event-item")).toBe(false);
    wrapped.clear();
    await rerender(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="day"
          selectedDate={oct22}
          events={[meeting]}
          draggable
        />
      </GestureAdapterProvider>,
    );
    expect(wrapped.size).toBe(0);
  });

  it("reports the occurrence of a recurring event", async () => {
    const onEventDrop = jest.fn<void, [Drop]>();
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view="day"
          selectedDate={oct22}
          events={[
            {
              ...meeting,
              startDate: "2026-10-01T09:00:00",
              endDate: "2026-10-01T10:00:00",
              rrule: "FREQ=DAILY",
            },
          ]}
          draggable
          onEventDrop={onEventDrop}
        />
      </GestureAdapterProvider>,
    );
    const id = "calendar-m::2026-10-22T09:00:00-day-event-item";
    await drop(id, 0, 4 * wrapped.get(id)!.move!.snapY);
    const info = onEventDrop.mock.calls[0]![0];
    expect(info.event).toMatchObject({
      recurringEventId: "m",
      occurrenceDate: "2026-10-22T09:00:00",
    });
    expect(iso(info.start)).toBe("2026-10-22T10:00:00.000");
  });
});

describe("month", () => {
  const wide = { width: 1194, height: 844 };

  it("moves a chip by days and weeks, keeping a timed event's time", async () => {
    const onEventDrop = jest.fn<void, [Drop]>();
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          selectedDate={oct22}
          events={[meeting, offsite]}
          draggable
          onEventDrop={onEventDrop}
        />
      </GestureAdapterProvider>,
      wide,
    );
    const chip = "calendar-m-month-event-item";
    const { snapX, snapY } = wrapped.get(chip)!.move!;
    await drop(chip, snapX, snapY);
    const info = onEventDrop.mock.calls[0]![0];
    expect(iso(info.start)).toBe("2026-10-30T09:00:00.000");
    expect(info).toMatchObject({ allDay: false, view: "month" });

    await drop("calendar-o-month-event-item", -snapX, 0);
    const allDay = onEventDrop.mock.calls[1]![0];
    expect([iso(allDay.start), iso(allDay.end), allDay.allDay]).toEqual([
      "2026-10-12T00:00:00.000",
      "2026-10-13T00:00:00.000",
      true,
    ]);
  });

  it("keeps chips inside the grid", async () => {
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={() => {}}
        />
      </GestureAdapterProvider>,
      wide,
    );
    const { snapX, snapY, bounds } = wrapped.get(
      "calendar-m-month-event-item",
    )!.move!;
    // Thu 22 Oct: column 4 of 7, row 3 of 5.
    expect(bounds).toEqual({
      minX: -4 * snapX,
      maxX: 2 * snapX,
      minY: -3 * snapY,
      maxY: 1 * snapY,
    });
  });

  it("phone bars are not draggable", async () => {
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          selectedDate={oct22}
          events={[meeting]}
          draggable
          onEventDrop={() => {}}
        />
      </GestureAdapterProvider>,
    );
    expect(wrapped.size).toBe(0);
  });
});

describe("without the gestures entry", () => {
  it("offers screen-reader move actions and warns once", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const onEventDrop = jest.fn<void, [Drop]>();
    await renderCalendar(
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        draggable
        onEventDrop={onEventDrop}
      />,
    );
    const el = screen.getByTestId("calendar-m-day-event-item");
    expect(
      (el.props.accessibilityActions as { label: string }[]).map(
        (a) => a.label,
      ),
    ).toEqual([
      "Move 15 minutes earlier",
      "Move 15 minutes later",
      "Move to the previous day",
      "Move to the next day",
    ]);
    await fireEvent(el, "accessibilityAction", {
      nativeEvent: { actionName: "moveLater" },
    });
    await fireEvent(el, "accessibilityAction", {
      nativeEvent: { actionName: "movePreviousDay" },
    });
    expect(iso(onEventDrop.mock.calls[0]![0].start)).toBe(
      "2026-10-22T09:15:00.000",
    );
    expect(iso(onEventDrop.mock.calls[1]![0].start)).toBe(
      "2026-10-21T09:00:00.000",
    );
    expect(
      warn.mock.calls.filter(([m]) => String(m).includes("<CalendarGestures>")),
    ).toHaveLength(1);
    warn.mockRestore();
  });

  it("adds nothing when draggable is off", async () => {
    await renderCalendar(
      <Calendar view="day" selectedDate={oct22} events={[meeting]} />,
    );
    expect(
      screen.getByTestId("calendar-m-day-event-item").props
        .accessibilityActions,
    ).toBeUndefined();
  });
});
