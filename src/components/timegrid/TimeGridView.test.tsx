import { screen, within } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import type { ECalendarViewType } from "../../core";
import type { CalendarProps } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const grid = (view: ECalendarViewType, props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar view={view} selectedDate={new Date(2026, 9, 22)} {...props} />,
  );

it("week shows Sun–Sat with today highlighted", async () => {
  await grid("week");
  expect(screen.getByTestId("calendar-week-view")).toBeOnTheScreen();
  expect(screen.getAllByTestId(/-day-header$/)).toHaveLength(7);
  expect(
    screen.getByTestId("calendar-2026-10-22-day-header"),
  ).toHaveTextContent("THU22");
});

it("custom days render only for 1–10", async () => {
  await grid("customDays", { customDays: 3 });
  expect(screen.getByTestId("calendar-custom-days-view")).toBeOnTheScreen();
  expect(screen.getAllByTestId("calendar-day-column")).toHaveLength(3);
});

it("custom days 11 renders nothing", async () => {
  await grid("customDays", { customDays: 11 });
  expect(screen.queryByTestId("calendar-custom-days-view")).toBeNull();
});

it("time column follows minHour/maxHour and is12Hour", async () => {
  await grid("day", { minHour: 8, maxHour: 18, is12Hour: true });
  const col = screen.getByTestId("calendar-time-column");
  expect(within(col).getAllByText(/AM|PM/)).toHaveLength(10);
  expect(within(col).getByText("08 AM")).toBeOnTheScreen();
});

it("renderDateCell replaces the column header with date and isToday", async () => {
  const spy = jest.fn(() => null);
  await grid("day", { renderDateCell: spy });
  expect(spy).toHaveBeenCalledWith({
    date: expect.any(Date) as unknown,
    isToday: true,
  });
  expect(screen.queryByTestId("calendar-2026-10-22-day-header")).toBeNull();
});
