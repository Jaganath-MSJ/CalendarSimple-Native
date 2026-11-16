import "react-native-gesture-handler/jestSetup";
import { StyleSheet, type ViewStyle } from "react-native";
import { screen } from "@testing-library/react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Calendar } from "../components/Calendar";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";
import { CalendarGestures, pickMode, snapOffset } from ".";

// Gesture-handler installs UI-runtime bindings on load; the JS worklets
// implementation has no UI runtime, so give it an empty holder.
jest.mock("react-native-worklets", () => ({
  ...jest.requireActual<object>("react-native-worklets"),
  getUIRuntimeHolder: () => ({}),
}));

// The detector needs the native UI runtime; layout is what is tested here
// (gesture recognition is checked on devices).
jest.mock("react-native-gesture-handler", () => ({
  ...jest.requireActual<object>("react-native-gesture-handler"),
  GestureDetector: ({ children }: { children: unknown }) => children,
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
