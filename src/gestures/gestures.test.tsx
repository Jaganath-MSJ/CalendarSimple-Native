import "react-native-gesture-handler/jestSetup";
import { StyleSheet, type ViewStyle } from "react-native";
import { act, screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Calendar } from "../components/Calendar";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";
import { CalendarGestures, pickMode, snapOffset, zoomedHourHeight } from ".";

// Gesture-handler installs UI-runtime bindings on load; the JS worklets
// implementation has no UI runtime, so give it an empty holder.
jest.mock("react-native-worklets", () => ({
  ...jest.requireActual<object>("react-native-worklets"),
  getUIRuntimeHolder: () => ({}),
}));

// The detector needs the native UI runtime; layout is what is tested here
// (gesture recognition is checked on devices). Each render's gesture is kept.
const mockGestures: unknown[] = [];
jest.mock("react-native-gesture-handler", () => ({
  ...jest.requireActual<object>("react-native-gesture-handler"),
  GestureDetector: ({
    children,
    gesture,
  }: {
    children: unknown;
    gesture: unknown;
  }) => {
    mockGestures.push(gesture);
    return children;
  },
}));

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

describe("snapOffset", () => {
  it("snaps to whole steps", () => {
    expect(snapOffset(22, 15, -100, 100)).toBe(15);
    expect(snapOffset(23, 15, -100, 100)).toBe(30);
    expect(snapOffset(-8, 15, -100, 100)).toBe(-15);
  });

  it("stays inside the bounds, on a step", () => {
    // 100 px down is allowed, but only 6 whole 15 px steps fit.
    expect(snapOffset(500, 15, -100, 100)).toBe(90);
    expect(snapOffset(-500, 15, -100, 100)).toBe(-90);
    expect(snapOffset(80, 50, 0, 120)).toBe(100);
  });

  it("locks an axis with step 0 and never returns -0", () => {
    expect(snapOffset(80, 0, -100, 100)).toBe(0);
    expect(Object.is(snapOffset(-3, 15, -100, 100), 0)).toBe(true);
  });
});

describe("pickMode", () => {
  // 0 nothing, 1 move, 2 top edge, 3 bottom edge.
  it("resizes from the edge zones and moves elsewhere", () => {
    expect(pickMode(5, 120, true, true, true)).toBe(2);
    expect(pickMode(-8, 120, true, true, true)).toBe(2); // in the hit slop
    expect(pickMode(60, 120, true, true, true)).toBe(1);
    expect(pickMode(110, 120, true, true, true)).toBe(3);
  });

  it("shrinks the zones on short events and respects what is allowed", () => {
    // 30 pt tall: zones are 7.5 pt, the middle still moves.
    expect(pickMode(10, 30, true, true, true)).toBe(1);
    expect(pickMode(5, 120, true, false, true)).toBe(1);
    expect(pickMode(110, 120, false, true, true)).toBe(3);
    expect(pickMode(60, 120, false, true, true)).toBe(0);
  });
});

it("CalendarGestures draws draggable events inside the gesture wrapper", async () => {
  await renderCalendar(
    <GestureHandlerRootView>
      <CalendarGestures>
        <Calendar
          view="day"
          selectedDate={new Date(2026, 9, 22)}
          events={[
            {
              id: "m",
              title: "Meeting",
              startDate: "2026-10-22T09:00:00",
              endDate: "2026-10-22T10:00:00",
            },
          ]}
          draggable
          onEventDrop={() => {}}
        />
      </CalendarGestures>
    </GestureHandlerRootView>,
  );
  const item = screen.getByTestId("calendar-m-day-event-item");
  // The event fills the wrapper, which carries the frame (top 540 at 60/h).
  expect(item).toHaveStyle({ top: 0, bottom: 0 });
  let wrapper = item.parent;
  while (wrapper && wrapper.type !== "View") wrapper = wrapper.parent;
  while (
    wrapper &&
    !StyleSheet.flatten(wrapper.props.style as ViewStyle)?.position
  )
    wrapper = wrapper.parent;
  expect(wrapper).toHaveStyle({ position: "absolute", top: 540, height: 60 });
});

describe("zoomedHourHeight", () => {
  it("scales, rounds and stays inside the limits", () => {
    expect(zoomedHourHeight(60, 1.5, 30, 180)).toBe(90);
    expect(zoomedHourHeight(60, 1.234, 30, 180)).toBe(74);
    expect(zoomedHourHeight(60, 10, 30, 180)).toBe(180);
    expect(zoomedHourHeight(60, 0.1, 30, 180)).toBe(30);
  });
});

it("CalendarGestures wraps the time grid when pinchToZoom is on", async () => {
  await renderCalendar(
    <GestureHandlerRootView>
      <CalendarGestures>
        <Calendar
          view="week"
          selectedDate={new Date(2026, 9, 22)}
          events={[
            {
              id: "m",
              title: "Meeting",
              startDate: "2026-10-22T09:00:00",
              endDate: "2026-10-22T10:00:00",
            },
          ]}
          pinchToZoom
          hourHeight={90}
        />
      </CalendarGestures>
    </GestureHandlerRootView>,
  );
  expect(screen.getByTestId("calendar-m-day-event-item")).toHaveStyle({
    top: 810,
    height: 90,
  });
});

it("the pinch activates as soon as two fingers are down", async () => {
  mockGestures.length = 0;
  await renderCalendar(
    <GestureHandlerRootView>
      <CalendarGestures>
        <Calendar view="day" selectedDate={new Date(2026, 9, 22)} pinchToZoom />
      </CalendarGestures>
    </GestureHandlerRootView>,
  );
  type Touches = { numberOfTouches: number; allTouches: { y: number }[] };
  type Handler = (e: Touches, m: { activate: () => void }) => void;
  const pinch = mockGestures.at(-1) as {
    config: { manualActivation?: boolean };
    handlers: { onTouchesDown: Handler; onTouchesMove: Handler };
  };
  // It must not wait for its own threshold: the scroll views would take the
  // touch first and cancel it.
  expect(pinch.config.manualActivation).toBe(true);
  const manager = { activate: jest.fn() };
  pinch.handlers.onTouchesDown(
    { numberOfTouches: 1, allTouches: [{ y: 100 }] },
    manager,
  );
  expect(manager.activate).not.toHaveBeenCalled();
  // Android begins a pinch after the second finger's down event: the first
  // move with two fingers activates it too.
  pinch.handlers.onTouchesMove(
    { numberOfTouches: 2, allTouches: [{ y: 100 }, { y: 300 }] },
    manager,
  );
  expect(manager.activate).toHaveBeenCalledTimes(1);
});

it("reports a haptic snap only when the snapped offset changes", async () => {
  mockGestures.length = 0;
  const onHaptic = jest.fn<void, [string]>();
  const now = jest.spyOn(Date, "now");
  await renderCalendar(
    <GestureHandlerRootView>
      <CalendarGestures>
        <Calendar
          view="day"
          selectedDate={new Date(2026, 9, 22)}
          events={[
            {
              id: "m",
              title: "Meeting",
              startDate: "2026-10-22T09:00:00",
              endDate: "2026-10-22T10:00:00",
            },
          ]}
          draggable
          onEventDrop={() => {}}
          onHaptic={onHaptic}
        />
      </CalendarGestures>
    </GestureHandlerRootView>,
  );
  type Pan = {
    handlers: {
      onStart: (e: { y: number }) => void;
      onUpdate: (e: { translationX: number; translationY: number }) => void;
    };
  };
  // The event's pan (the time grid has no pinch here).
  const pan = mockGestures.find(
    (g) => (g as { handlerName?: string }).handlerName === "PanGestureHandler",
  ) as Pan;
  pan.handlers.onStart({ y: 30 });
  const update = async (dy: number, ms: number) => {
    now.mockReturnValue(ms);
    pan.handlers.onUpdate({ translationX: 0, translationY: dy });
    // runOnJS calls back on a timer (fake here).
    await act(() => jest.runOnlyPendingTimers());
  };
  await update(4, 1000); // still 0: no step
  await update(9, 1100); // 15: a step
  await update(12, 1200); // still 15
  await update(-1, 1300); // back to 0: a step
  now.mockRestore();
  expect(onHaptic.mock.calls.map((c) => c[0])).toEqual([
    "lift",
    "snap",
    "snap",
  ]);
});
