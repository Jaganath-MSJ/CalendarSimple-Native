import { act, fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

const isoOf = (d?: Date) => (d ? DateTime.fromJSDate(d).toISODate() : null);

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const nav = jest.fn<void, [Date]>();
beforeEach(() => nav.mockReset());
const setup = (w = 390, props = {}) =>
  renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      onNavigate={nav}
      {...props}
    />,
    { width: w, height: 844 },
  );

it("shows the month title", async () => {
  await setup();
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "October 2026",
  );
});

it("prev predicts the new date and moves", async () => {
  await setup();
  await fireEvent.press(screen.getByTestId("calendar-header-prev-btn"));
  expect(isoOf(nav.mock.calls[0]?.[0])).toBe("2026-09-22");
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "September 2026",
  );
});

it("rapid prev taps chain through useNavigate", async () => {
  await setup();
  const prev = screen.getByTestId("calendar-header-prev-btn");
  await fireEvent.press(prev);
  await fireEvent.press(prev);
  expect(isoOf(nav.mock.calls[1]?.[0])).toBe("2026-08-22");
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "August 2026",
  );
});

it("Today returns and reports now", async () => {
  await setup(390, { selectedDate: new Date(2025, 0, 1) });
  await fireEvent.press(screen.getByTestId("calendar-header-today-btn"));
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "October 2026",
  );
  expect(isoOf(nav.mock.calls[0]?.[0])).toBe("2026-10-22");
});

it("two rows on phone", async () => {
  await setup(390);
  expect(screen.getByTestId("calendar-header-row-2")).toBeOnTheScreen();
});

it("one row on wide", async () => {
  await setup(1194);
  expect(screen.queryByTestId("calendar-header-row-2")).toBeNull();
});

it("labels for screen readers come from messages", async () => {
  await setup(390, { localeMessages: { previous: "Précédent" } });
  expect(screen.getByLabelText("Précédent")).toBeOnTheScreen();
  expect(screen.getByLabelText("Calendar navigation")).toBeOnTheScreen();
});

it("headerStyle wins over styles.header", async () => {
  await renderCalendar(
    <Calendar styles={{ header: { padding: 1 } }}>
      <Calendar.Header headerStyle={{ padding: 7 }} />
    </Calendar>,
  );
  expect(screen.getByTestId("calendar-header")).toHaveStyle({ padding: 7 });
});

it("Today then › in the same frame chains; one onDateRangeChange", async () => {
  const onDateRangeChange = jest.fn();
  await setup(390, {
    selectedDate: new Date(2025, 0, 1),
    onDateRangeChange,
  });
  await act(() => jest.advanceTimersByTime(50));
  onDateRangeChange.mockClear();
  const today = screen.getByTestId("calendar-header-today-btn");
  const next = screen.getByTestId("calendar-header-next-btn");
  // Both presses land in one act, before React re-renders.
  const click = (el: typeof today) =>
    (el.props as { onClick: (e: object) => void }).onClick({
      nativeEvent: {},
      persist: () => {},
    });
  await act(() => {
    click(today);
    click(next);
  });
  await act(() => jest.advanceTimersByTime(50));
  expect(isoOf(nav.mock.calls[1]?.[0])).toBe("2026-11-22");
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "November 2026",
  );
  expect(onDateRangeChange).toHaveBeenCalledTimes(1);
});
