import { render, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import type { ReactElement } from "react";
import { CalendarProvider } from "../../context/CalendarContext";
import { MonthCell } from "./MonthCell";
import type { CalendarDayInfo } from "../../core";

const info = (over: Partial<CalendarDayInfo> = {}): CalendarDayInfo => ({
  currentDate: DateTime.fromISO("2026-10-05"),
  isCurrentMonth: true,
  displayDay: 5,
  events: [],
  totalEvents: 0,
  isToday: false,
  isTodayAdjacent: false,
  ...over,
});

const inProvider = (ui: ReactElement) =>
  render(
    <CalendarProvider
      initialDate={DateTime.fromISO("2026-10-05")}
      initialView="month"
    >
      {ui}
    </CalendarProvider>,
  );

it("adjacent cells are muted", async () => {
  await inProvider(
    <MonthCell
      info={info({ isCurrentMonth: false })}
      width={50}
      height={80}
      onPress={jest.fn()}
    />,
  );
  expect(screen.getByTestId("calendar-5-month-cell")).toHaveStyle({
    backgroundColor: "#f3f4f6",
  });
  expect(screen.getByTestId("calendar-5-month-label")).toHaveStyle({
    color: "#4b5563",
  });
});

it("labels an empty day with no events", async () => {
  await inProvider(
    <MonthCell info={info()} width={50} height={80} onPress={jest.fn()} />,
  );
  expect(screen.getByTestId("calendar-5-month-cell")).toHaveProp(
    "accessibilityLabel",
    "October 5, 2026, no events",
  );
});
