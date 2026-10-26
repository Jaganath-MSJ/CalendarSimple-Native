import { fireEvent, screen } from "@testing-library/react-native";
import { Platform, processColor, View } from "react-native";
import { Calendar } from "./Calendar";
import { OCT_2026_EVENTS } from "../core/test/fixtures";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";
import { PALETTE } from "../theme";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

/**
 * Brief deviation: `Pressable` consumes `android_ripple` and hands the host
 * view `nativeBackgroundAndroid` (RN 0.8x), and RNTL 14 only returns host
 * elements, so the ripple is asserted on what the host receives.
 */
const expectRipple = (testID: string) => {
  const el = screen.getAllByTestId(testID)[0]!;
  if (Platform.OS === "android")
    expect(el).toHaveProp(
      "nativeBackgroundAndroid",
      expect.objectContaining({
        type: "RippleAndroid",
        color: processColor(PALETTE.light.bgMuted),
      }),
    );
  else expect(el.props.nativeBackgroundAndroid).toBeUndefined();
};

it("ripple on Android only", async () => {
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />);
  expectRipple("calendar-22-month-cell");
});

it.each([
  ["month", "calendar-header-today-btn"],
  ["month", "calendar-header-view-select"],
  ["week", "calendar-o19-day-event-item"],
  ["schedule", "calendar-o19-schedule-event"],
] as const)("%s: %s ripples on Android", async (view, id) => {
  await renderCalendar(
    <Calendar
      view={view}
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
    />,
  );
  expectRipple(id);
});

it("sheet respects safeAreaInsets.bottom", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      safeAreaInsets={{ bottom: 34 }}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(screen.getByTestId("calendar-day-sheet")).toHaveStyle({
    paddingBottom: 34,
  });
});

it("sheet without an inset falls back to the panel padding", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(screen.getByTestId("calendar-day-sheet")).toHaveStyle({
    paddingBottom: 8,
  });
});

it("raised surfaces use the platform shadow (TDD §11)", async () => {
  const proto = View.prototype as unknown as {
    measureInWindow: (cb: (...n: number[]) => void) => void;
  };
  const measure = jest
    .spyOn(proto, "measureInWindow")
    .mockImplementation((cb) => cb(0, 0, 100, 36));
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />, {
    width: 1194,
    height: 834,
  });
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  const menu = screen.getByTestId("calendar-menu-view");
  if (Platform.OS === "android") {
    expect(menu).toHaveStyle({ elevation: 4 });
    expect(menu).not.toHaveStyle({ shadowOpacity: 0.15 });
  } else {
    expect(menu).toHaveStyle({ shadowOpacity: 0.15 });
    expect(menu).not.toHaveStyle({ elevation: 4 });
  }
  measure.mockRestore();
});
