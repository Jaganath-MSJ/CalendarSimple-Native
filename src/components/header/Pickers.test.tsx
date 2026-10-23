import { act, fireEvent, screen } from "@testing-library/react-native";
import { ScrollView, View } from "react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

const isoOf = (d?: Date) => (d ? DateTime.fromJSDate(d).toISODate() : null);

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("view picker switches view and reports it", async () => {
  const onViewChange = jest.fn();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      onViewChange={onViewChange}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  await fireEvent.press(screen.getByTestId("calendar-menu-option-week"));
  expect(onViewChange).toHaveBeenCalledWith("week");
  expect(screen.queryByTestId("calendar-menu-view")).toBeNull();
});

it("offers N Days only for 1–10", async () => {
  await renderCalendar(<Calendar customDays={3} />);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(screen.getByText("3 Days")).toBeOnTheScreen();
});

it("does not offer N Days for 11", async () => {
  await renderCalendar(<Calendar customDays={11} />);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(screen.queryByText("11 Days")).toBeNull();
});

it("month picker clamps the day (Jan 31 → Feb 28)", async () => {
  const nav = jest.fn<void, [Date]>();
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 0, 31)} onNavigate={nav} />,
  );
  await fireEvent.press(screen.getByTestId("calendar-header-month-select"));
  await fireEvent.press(screen.getByTestId("calendar-menu-option-1"));
  expect(isoOf(nav.mock.calls[0]?.[0])).toBe("2026-02-28");
  expect(screen.queryByTestId("calendar-menu-month")).toBeNull();
});

it("year picker sets the year", async () => {
  const nav = jest.fn<void, [Date]>();
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} onNavigate={nav} />,
  );
  await fireEvent.press(screen.getByTestId("calendar-header-year-select"));
  await fireEvent.press(screen.getByTestId("calendar-menu-option-2027"));
  expect(isoOf(nav.mock.calls[0]?.[0])).toBe("2027-10-22");
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "October 2027",
  );
});

it("#12A: year list includes a year outside the range", async () => {
  await renderCalendar(<Calendar selectedDate={new Date(2040, 4, 1)} />);
  await fireEvent.press(screen.getByTestId("calendar-header-year-select"));
  expect(screen.getByTestId("calendar-menu-option-2040")).toBeOnTheScreen();
});

it("resetDateOnViewChange jumps to today", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2025, 0, 1)} resetDateOnViewChange />,
  );
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  await fireEvent.press(screen.getByTestId("calendar-menu-option-day"));
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "October 22, 2026",
  );
});

it("Android back (onRequestClose) closes the sheet", async () => {
  await renderCalendar(<Calendar />);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  await fireEvent(screen.getByTestId("calendar-menu-view"), "requestClose");
  expect(screen.queryByTestId("calendar-menu-view")).toBeNull();
});

it("wide layout uses the anchored menu", async () => {
  const proto = View.prototype as unknown as {
    measureInWindow: (cb: (...n: number[]) => void) => void;
  };
  jest
    .spyOn(proto, "measureInWindow")
    .mockImplementationOnce((cb) => cb(0, 0, 100, 36));
  await renderCalendar(<Calendar />, { width: 1194, height: 834 });
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(screen.getByTestId("calendar-menu-view")).toHaveProp(
    "accessibilityRole",
    "menu",
  );
});

it("year sheet scrolls to the selected year (Android has no contentOffset)", async () => {
  const scrollTo = jest
    .spyOn(ScrollView.prototype, "scrollTo")
    .mockImplementation(() => {});
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />);
  await fireEvent.press(screen.getByTestId("calendar-header-year-select"));
  await fireEvent(
    screen.getByTestId("calendar-menu-year-list"),
    "contentSizeChange",
    390,
    2000,
  );
  // Two rows above the selected year stay visible.
  expect(scrollTo).toHaveBeenCalledTimes(1);
  const arg = scrollTo.mock.calls[0]?.[0] as { y: number; animated: boolean };
  expect(arg.animated).toBe(false);
  expect(arg.y).toBeGreaterThan(0);
  scrollTo.mockRestore();
});

it("wide menu opens only once measured, at the measured anchor", async () => {
  type Measure = (
    cb: (x: number, y: number, w: number, h: number) => void,
  ) => void;
  const proto = View.prototype as unknown as { measureInWindow: Measure };
  let report: Parameters<Measure>[0] | undefined;
  const spy = jest.spyOn(proto, "measureInWindow").mockImplementation((cb) => {
    report = cb;
  });
  await renderCalendar(<Calendar />, { width: 1194, height: 834 });
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(screen.queryByTestId("calendar-menu-view")).toBeNull();
  await act(() => report?.(300, 40, 120, 36));
  expect(screen.getByTestId("calendar-menu-view")).toHaveStyle({
    top: 80,
    left: 300,
    width: 180,
  });
  spy.mockRestore();
});
