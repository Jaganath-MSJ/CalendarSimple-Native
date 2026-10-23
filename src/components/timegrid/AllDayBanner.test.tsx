import { AccessibilityInfo, LayoutAnimation, ScrollView } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { getGmtOffset, layoutAllDayBanner } from "../../core";
import { DateTime } from "luxon";
import { bannerHeight } from "./AllDayBanner";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { getMetrics } from "../../theme";
import type { CalendarProps } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const week = (props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar
      view="week"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      {...props}
    />,
  );
const colW = 330 / 7;
const { rowHeight, chipHeight } = getMetrics("phone", 2).banner;

it("places stacked chips", async () => {
  await week();
  // Design sprint, row 1
  expect(screen.getByTestId("calendar-o8-all-day-event")).toHaveStyle({
    top: rowHeight + 2,
    left: colW + 2,
    width: 4 * colW - 4,
    height: chipHeight,
  });
});

it("draws arrows on clipped sides", async () => {
  await week();
  // On call started 17 Oct
  expect(screen.getByTestId("calendar-o7-all-day-event")).toHaveStyle({
    paddingLeft: 14,
  });
  // Conference ends 26 Oct
  expect(screen.getByTestId("calendar-o26-all-day-event")).toHaveStyle({
    paddingRight: 14,
  });
});

it("shows the GMT offset", async () => {
  await week();
  expect(screen.getByText(getGmtOffset())).toBeOnTheScreen();
});

it("press calls onEventClick and labels the chip", async () => {
  const onEventClick = jest.fn();
  await week({ onEventClick });
  const chip = screen.getByTestId("calendar-o16-all-day-event");
  expect(chip.props.accessibilityLabel).toMatch(/^Hackathon, /);
  await fireEvent.press(chip);
  expect(onEventClick).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Hackathon" }),
  );
});

afterEach(() => jest.restoreAllMocks());

it("long press calls onEventLongPress", async () => {
  const onEventLongPress = jest.fn();
  await week({ onEventLongPress });
  await fireEvent(
    screen.getByTestId("calendar-o16-all-day-event"),
    "longPress",
  );
  expect(onEventLongPress).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Hackathon" }),
  );
});

it("mirrors offsets and arrows under RTL", async () => {
  await week({ locale: "ar" });
  expect(screen.getByTestId("calendar-o8-all-day-event")).toHaveStyle({
    right: colW + 2,
  });
  // On call is clipped at the start: arrow and padding on the right.
  const onCall = screen.getByTestId("calendar-o7-all-day-event");
  expect(onCall).toHaveStyle({ paddingRight: 14 });
  expect(
    screen.getByTestId("calendar-o7-all-day-event-arrow-start"),
  ).toHaveStyle({ right: -10 });
});

it("the banner body follows the grid's horizontal scroll", async () => {
  const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
  await week({ swipeNavigation: false });
  scrollTo.mockClear();
  await fireEvent.scroll(screen.getByTestId("calendar-time-grid-hscroll"), {
    nativeEvent: { contentOffset: { x: 120, y: 0 } },
  });
  // Header and banner both follow.
  const synced = scrollTo.mock.calls.filter(
    ([a]) => (a as { x?: number } | undefined)?.x === 120,
  );
  expect(synced).toHaveLength(2);
  expect(
    screen.getByTestId("calendar-all-day-banner-scroll"),
  ).toBeOnTheScreen();
});

it("Reduce Motion skips the height animation", async () => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  const configureNext = jest.spyOn(LayoutAnimation, "configureNext");
  await week();
  await act(async () => {});
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-all-day-expand-icon")),
  );
  expect(screen.getByTestId("calendar-o17-all-day-event")).toBeOnTheScreen();
  expect(configureNext).not.toHaveBeenCalled();
});

it("animates the height change otherwise", async () => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
  const configureNext = jest.spyOn(LayoutAnimation, "configureNext");
  await week();
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-all-day-expand-icon")),
  );
  expect(configureNext).toHaveBeenCalledTimes(1);
});

it("bannerHeight at scale 1 equals the core containerHeight", () => {
  const days = Array.from({ length: 7 }, (_, i) =>
    DateTime.local(2026, 10, 18).plus({ days: i }),
  );
  for (const expanded of [false, true]) {
    for (const max of [1, 2, 3]) {
      const b = layoutAllDayBanner(days, OCT_2026_EVENTS, expanded, max);
      expect(bannerHeight(b, expanded, 24, 28)).toBe(b.containerHeight);
    }
  }
});
