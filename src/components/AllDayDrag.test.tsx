import type { ReactElement } from "react";
import { Platform, View } from "react-native";
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

// All-day chips move sideways by whole days (calendar-simple); vertical
// movement does nothing and times are kept.
const wrapped = new Map<string, DragWrapperProps>();
function FakeWrapper(props: DragWrapperProps) {
  const id = (props.children as ReactElement<{ testID?: string }>).props.testID;
  if (id) wrapped.set(id, props);
  return <View style={props.style}>{props.children}</View>;
}
const ADAPTER = { EventWrapper: FakeWrapper };
beforeEach(() => wrapped.clear());

const offsite: CalendarEvent = {
  id: "o",
  title: "Offsite",
  startDate: "2026-10-20",
  endDate: "2026-10-21",
};
const trip: CalendarEvent = {
  id: "t",
  title: "Trip",
  startDate: "2026-10-22T18:00:00",
  endDate: "2026-10-24T09:00:00",
};
const ymd = (d: Date) => DateTime.fromJSDate(d).toFormat("yyyy-MM-dd HH:mm");
const chip = (id: string) => `calendar-${id}-all-day-event`;

async function week(extra: Partial<Parameters<typeof Calendar>[0]> = {}) {
  const onEventDrop = jest.fn<void, [EventDropInfo]>();
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="week"
        selectedDate={new Date(2026, 9, 22)}
        events={[offsite, trip]}
        draggable
        onEventDrop={onEventDrop}
        onEventClick={onEventClick}
        {...extra}
      />
    </GestureAdapterProvider>,
    { width: 1194, height: 844 },
  );
  return { onEventDrop, onEventClick };
}

it("moves by whole days only, inside the visible week", async () => {
  await week();
  const move = wrapped.get(chip("o"))!.move!;
  expect(move.snapY).toBe(0);
  expect(move.bounds.minY).toBe(0);
  expect(move.bounds.maxY).toBe(0);
  // Tue–Wed in a Sun–Sat week: 2 days back, 3 days forward.
  expect(move.bounds.minX).toBe(-2 * move.snapX);
  expect(move.bounds.maxX).toBe(3 * move.snapX);
});

it("a drop reports whole days, allDay, and the same times", async () => {
  const { onEventDrop } = await week();
  const o = wrapped.get(chip("o"))!.move!;
  await act(() => o.onEnd(2 * o.snapX, 0));
  const t = wrapped.get(chip("t"))!.move!;
  await act(() => t.onEnd(-t.snapX, 0));
  const [a, b] = onEventDrop.mock.calls.map((c) => c[0]);
  expect([ymd(a!.start), ymd(a!.end), a!.allDay, a!.view]).toEqual([
    "2026-10-22 00:00",
    "2026-10-23 00:00",
    true,
    "week",
  ]);
  // A timed multi-day event keeps its times and stays timed.
  expect([ymd(b!.start), ymd(b!.end), b!.allDay]).toEqual([
    "2026-10-21 18:00",
    "2026-10-23 09:00",
    false,
  ]);
});

it("right to left: dragging left is later", async () => {
  const { onEventDrop } = await week({ locale: "ar", direction: "rtl" });
  const o = wrapped.get(chip("o"))!.move!;
  await act(() => o.onEnd(-o.snapX, 0));
  expect(ymd(onEventDrop.mock.calls[0]![0].start)).toBe("2026-10-21 00:00");
});

it("screen readers get the day moves; a plain press is still a click", async () => {
  const { onEventDrop, onEventClick } = await week();
  const el = screen.getByTestId(chip("o"));
  const actions = el.props.accessibilityActions as { name: string }[];
  expect(actions.map((a) => a.name)).toEqual([
    "movePreviousDay",
    "moveNextDay",
  ]);
  await fireEvent(el, "accessibilityAction", {
    nativeEvent: { actionName: "moveNextDay" },
  });
  expect(ymd(onEventDrop.mock.calls[0]![0].start)).toBe("2026-10-21 00:00");
  await fireEvent(el, "pressIn");
  await fireEvent.press(el);
  expect(onEventClick).toHaveBeenCalledWith(offsite);
});

it("web: Alt+←/→ move a day; ↑/↓ do nothing", async () => {
  const os = jest.replaceProperty(Platform, "OS", "web");
  const { onEventDrop } = await week();
  const key = (k: string) =>
    fireEvent(screen.getByTestId(chip("o")), "keyDown", {
      nativeEvent: { key: k, altKey: true },
      preventDefault: () => {},
    });
  await key("ArrowRight");
  await key("ArrowUp");
  expect(onEventDrop.mock.calls.map((c) => ymd(c[0].start))).toEqual([
    "2026-10-21 00:00",
  ]);
  expect(screen.getByTestId(chip("o")).props["aria-keyshortcuts"]).toBe(
    "Alt+ArrowLeft Alt+ArrowRight",
  );
  os.restore();
});

it("not draggable: no wrapper and no actions", async () => {
  await week({ draggable: (e) => e.id !== "o" });
  expect(wrapped.has(chip("o"))).toBe(false);
  expect(wrapped.has(chip("t"))).toBe(true);
  expect(screen.getByTestId(chip("o")).props.accessibilityActions).toBe(
    undefined,
  );
});
