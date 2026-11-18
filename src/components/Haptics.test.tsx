import type { ReactElement } from "react";
import { Platform, View } from "react-native";
import { act } from "@testing-library/react-native";
import { Calendar } from "./Calendar";
import {
  GestureAdapterProvider,
  type DragWrapperProps,
} from "../context/GestureAdapterContext";
import type { CalendarEvent, HapticKind } from "../types";
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

const meeting: CalendarEvent = {
  id: "m",
  title: "Meeting",
  startDate: "2026-10-22T09:00:00",
  endDate: "2026-10-22T10:00:00",
};
const item = () => wrapped.get("calendar-m-day-event-item")!;

async function renderDay(onHaptic?: (kind: HapticKind) => void) {
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={new Date(2026, 9, 22)}
        events={[meeting]}
        draggable
        onEventDrop={() => {}}
        resizable
        onEventResize={() => {}}
        onHaptic={onHaptic}
      />
    </GestureAdapterProvider>,
  );
}

/** Runs `steps` with `Date.now()` at the given ms. */
function at(ms: number, step: () => void) {
  const now = jest.spyOn(Date, "now").mockReturnValue(ms);
  step();
  now.mockRestore();
}

it("a drag: lift, a snap per step, drop", async () => {
  const onHaptic = jest.fn<void, [HapticKind]>();
  await renderDay(onHaptic);
  await act(() => {
    const p = item();
    p.onDragStart();
    at(1000, p.onStep!);
    at(1100, p.onStep!);
    p.move!.onEnd(0, 30);
  });
  expect(onHaptic.mock.calls.map((c) => c[0])).toEqual([
    "lift",
    "snap",
    "snap",
    "drop",
  ]);
});

it("a resize: lift, snap, resize", async () => {
  const onHaptic = jest.fn<void, [HapticKind]>();
  await renderDay(onHaptic);
  await act(() => {
    const p = item();
    p.onDragStart();
    at(1000, p.onStep!);
    p.resize!.onEnd("bottom", 15);
  });
  expect(onHaptic.mock.calls.map((c) => c[0])).toEqual([
    "lift",
    "snap",
    "resize",
  ]);
});

it("a drag released where it started: lift, cancel", async () => {
  const onHaptic = jest.fn<void, [HapticKind]>();
  await renderDay(onHaptic);
  await act(() => {
    const p = item();
    p.onDragStart();
    p.onDragCancel();
  });
  expect(onHaptic.mock.calls.map((c) => c[0])).toEqual(["lift", "cancel"]);
});

it("snaps at most once every 50 ms", async () => {
  const onHaptic = jest.fn<void, [HapticKind]>();
  await renderDay(onHaptic);
  const { onStep } = item();
  at(1000, onStep!);
  at(1020, onStep!); // too soon
  at(1049, onStep!); // too soon
  at(1050, onStep!);
  expect(onHaptic.mock.calls.map((c) => c[0])).toEqual(["snap", "snap"]);
});

it("no step reports without onHaptic", async () => {
  await renderDay();
  expect(item().onStep).toBeUndefined();
});

it("never on web", async () => {
  const os = jest.replaceProperty(Platform, "OS", "web");
  const onHaptic = jest.fn();
  await renderDay(onHaptic);
  await act(() => {
    const p = item();
    p.onDragStart();
    p.move!.onEnd(0, 30);
  });
  expect(item().onStep).toBeUndefined();
  expect(onHaptic).not.toHaveBeenCalled();
  os.restore();
});
