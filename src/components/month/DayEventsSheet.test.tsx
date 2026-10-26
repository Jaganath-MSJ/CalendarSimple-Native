import { fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";
import type { CalendarEvent, CalendarProps } from "../../types";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const phone = (props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      {...props}
    />,
  );

it("opens the day sheet with the day's events in schedule order", async () => {
  await phone();
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(screen.getByTestId("calendar-day-sheet")).toBeOnTheScreen();
  expect(
    screen
      .getAllByTestId(/-day-sheet-item$/)
      .map((n) => n.props.testID as string),
  ).toEqual(
    ["o8", "o11", "o16", "o17", "o18", "o19", "o20", "o21", "o22"].map(
      (id) => `calendar-${id}-day-sheet-item`,
    ),
  );
  expect(screen.getByText("Design sprint (Day 4/4)")).toBeOnTheScreen();
  expect(screen.getByText("THU, 22 OCT · TODAY")).toBeOnTheScreen();
  expect(screen.getByText("9 events")).toBeOnTheScreen();
});

it("row press calls onEventClick and closes", async () => {
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  await phone({ onEventClick });
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  await fireEvent.press(screen.getByTestId("calendar-o20-day-sheet-item"));
  expect(onEventClick.mock.calls[0]![0].title).toBe("Design review");
  expect(screen.queryByTestId("calendar-day-sheet")).toBeNull();
});

it("Android back closes the sheet", async () => {
  await phone();
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  await fireEvent(
    screen.getByTestId("calendar-day-sheet-modal"),
    "requestClose",
  );
  expect(screen.queryByTestId("calendar-day-sheet")).toBeNull();
});

it("New event appears only when creatable and reports the whole day", async () => {
  const onSlotClick = jest.fn<void, [Date, Date]>();
  await phone({ creatable: true, onSlotClick });
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  await fireEvent.press(screen.getByTestId("calendar-day-sheet-new-event"));
  const [s, e] = onSlotClick.mock.calls[0]!.map((d) => DateTime.fromJSDate(d));
  expect([s!.toISO({ includeOffset: false }), e!.toFormat("HH:mm")]).toEqual([
    "2026-10-22T00:00:00.000",
    "23:59",
  ]);
  expect(screen.queryByTestId("calendar-day-sheet")).toBeNull();
});

it("no New event row without creatable", async () => {
  await phone();
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(screen.queryByTestId("calendar-day-sheet-new-event")).toBeNull();
});

it("an empty day fires onSlotClick and no sheet", async () => {
  const onSlotClick = jest.fn();
  await phone({ creatable: true, onSlotClick });
  await fireEvent.press(screen.getByTestId("calendar-2-month-cell"));
  expect(onSlotClick).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId("calendar-day-sheet")).toBeNull();
});

it("selectable: onDateClick fires before the sheet opens", async () => {
  const onDateClick = jest.fn<void, [Date]>();
  await phone({ selectable: true, onDateClick });
  await fireEvent.press(screen.getByTestId("calendar-23-month-cell"));
  expect(DateTime.fromJSDate(onDateClick.mock.calls[0]![0]).toISODate()).toBe(
    "2026-10-23",
  );
  expect(screen.getByTestId("calendar-day-sheet")).toBeOnTheScreen();
});

it("#14C: an untitled event is labelled for screen readers", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 5)}
      events={[{ id: "u", title: "", startDate: "2026-10-05T09:00:00" }]}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-5-month-cell"));
  expect(screen.getByTestId("calendar-u-day-sheet-item")).toHaveProp(
    "accessibilityLabel",
    expect.stringContaining("No title"),
  );
});
