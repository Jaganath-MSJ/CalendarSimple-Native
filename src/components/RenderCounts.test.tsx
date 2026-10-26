import { act, fireEvent, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Calendar } from "./Calendar";
import { OCT_2026_EVENTS } from "../core/test/fixtures";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

const mockRenders = { cell: 0, column: 0, timed: 0, scheduleRow: 0 };

/**
 * Replaces the memoised `name` from `path` with `memo(counting copy of its
 * body)`. Counting inside the body also catches re-renders forced by a
 * context change, which a wrapper around the component would miss.
 */
function mockCounted(
  path: string,
  name: string,
  key: keyof typeof mockRenders,
) {
  const React = jest.requireActual<typeof import("react")>("react");
  const actual =
    jest.requireActual<Record<string, { type: (p: object) => ReactNode }>>(
      path,
    );
  const body = actual[name]!.type;
  function Counted(p: object) {
    mockRenders[key]++;
    return body(p);
  }
  return { ...actual, [name]: React.memo(Counted) };
}

jest.mock("./month/MonthCell", () =>
  mockCounted("./month/MonthCell", "MonthCell", "cell"),
);
jest.mock("./timegrid/DayColumn", () =>
  mockCounted("./timegrid/DayColumn", "DayColumn", "column"),
);
jest.mock("./timegrid/TimedEventItem", () =>
  mockCounted("./timegrid/TimedEventItem", "TimedEventItem", "timed"),
);
jest.mock("./schedule/ScheduleRow", () =>
  mockCounted("./schedule/ScheduleRow", "ScheduleRow", "scheduleRow"),
);

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const date = new Date(2026, 9, 22);

/** Lets the pager mount its neighbour pages (first idle period) first. */
const settle = () => act(() => jest.advanceTimersByTime(1));

it("opening the view picker does not re-render month cells", async () => {
  await renderCalendar(
    <Calendar selectedDate={date} events={OCT_2026_EVENTS} />,
  );
  const before = mockRenders.cell;
  expect(before).toBeGreaterThan(0);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(mockRenders.cell).toBe(before);
});

it("opening the day sheet does not re-render month cells", async () => {
  await renderCalendar(
    <Calendar selectedDate={date} events={OCT_2026_EVENTS} />,
  );
  const before = mockRenders.cell;
  await fireEvent.press(screen.getByTestId("calendar-12-month-cell"));
  expect(mockRenders.cell).toBe(before);
});

it("opening the view picker does not re-render week columns or events", async () => {
  await renderCalendar(
    <Calendar view="week" selectedDate={date} events={OCT_2026_EVENTS} />,
  );
  const columns = mockRenders.column;
  const timed = mockRenders.timed;
  expect(columns).toBeGreaterThan(0);
  expect(timed).toBeGreaterThan(0);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(mockRenders.column).toBe(columns);
  expect(mockRenders.timed).toBe(timed);
});

it("opening the view picker does not re-render schedule rows", async () => {
  await renderCalendar(
    <Calendar view="schedule" selectedDate={date} events={OCT_2026_EVENTS} />,
  );
  const rows = mockRenders.scheduleRow;
  expect(rows).toBeGreaterThan(0);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expect(mockRenders.scheduleRow).toBe(rows);
});

it("a minute tick does not re-render month cells", async () => {
  await renderCalendar(
    <Calendar selectedDate={date} events={OCT_2026_EVENTS} />,
  );
  await settle();
  const before = mockRenders.cell;
  await act(() => jest.advanceTimersByTime(60_000));
  expect(mockRenders.cell).toBe(before);
});

it("a minute tick re-renders only today's week column", async () => {
  await renderCalendar(
    <Calendar view="week" selectedDate={date} events={OCT_2026_EVENTS} />,
  );
  await settle();
  const columns = mockRenders.column;
  const timed = mockRenders.timed;
  await act(() => jest.advanceTimersByTime(60_000));
  expect(mockRenders.column - columns).toBeLessThanOrEqual(1);
  expect(mockRenders.timed).toBe(timed);
});

it("a minute tick moves the now-line without re-rendering today's events", async () => {
  const today = [
    {
      id: "t1",
      title: "Today",
      startDate: "2026-10-22T09:00:00",
      endDate: "2026-10-22T10:00:00",
    },
  ];
  await renderCalendar(
    <Calendar view="day" selectedDate={date} events={today} showCurrentTime />,
  );
  await settle();
  const columns = mockRenders.column;
  const timed = mockRenders.timed;
  await act(() => jest.advanceTimersByTime(60_000));
  expect(mockRenders.column).toBeGreaterThan(columns); // the now-line moved
  expect(mockRenders.timed).toBe(timed);
});
