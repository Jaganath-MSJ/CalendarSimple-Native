import { fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { PALETTE } from "../../theme";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { emitAppState, useFrozenClock } from "../../test-utils/clock";
import type { CalendarProps } from "../../types";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const month = (
  props: Partial<CalendarProps> = {},
  size?: { width: number; height: number },
) =>
  renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      {...props}
    />,
    size,
  );

it("draws 5 rows × 7 cells for October 2026", async () => {
  await month();
  expect(screen.getAllByTestId(/-month-cell$/)).toHaveLength(35);
});

it("today is a filled primary circle", async () => {
  await month();
  expect(screen.getByTestId("calendar-22-month-label")).toHaveStyle({
    backgroundColor: PALETTE.light.primary,
    color: PALETTE.light.onPrimary,
  });
});

it("#17C: today in an adjacent month gets the outlined mark", async () => {
  useFrozenClock("2026-10-02T09:00:00");
  await renderCalendar(<Calendar selectedDate={new Date(2026, 8, 15)} />);
  const oct2 = screen.getAllByTestId("calendar-2-month-label")[1];
  // Muted outline (not primary), so it never reads as the selected day.
  expect(oct2).toHaveStyle({ borderColor: PALETTE.light.textSecondary });
  expect(oct2).not.toHaveStyle({ backgroundColor: PALETTE.light.primary });
});

it("selected day uses the outlined style when selectable", async () => {
  await month({ selectable: true, selectedDate: new Date(2026, 9, 14) });
  expect(screen.getByTestId("calendar-14-month-label")).toHaveStyle({
    borderColor: PALETTE.light.primary,
    color: PALETTE.light.primaryStrong,
  });
});

it("hides adjacent contents but keeps the cell", async () => {
  await month({ showAdjacentMonths: false });
  expect(screen.getAllByTestId("calendar-27-month-cell")).toHaveLength(2); // Sep 27 + Oct 27
  expect(screen.getAllByTestId("calendar-27-month-label")).toHaveLength(1); // only Oct 27
});

it("week numbers: 36 px column, ISO week of the row's first day", async () => {
  await month({ showWeekNumbers: true });
  expect(screen.getByTestId("calendar-0-week-number")).toHaveTextContent("39");
  expect(screen.getByTestId("calendar-0-week-number")).toHaveStyle({
    width: 36,
  });
});

it("renderDateCell receives the cell state", async () => {
  const spy = jest.fn(() => null);
  await month({ renderDateCell: spy });
  expect(spy).toHaveBeenCalledWith(
    expect.objectContaining({ isToday: true, isCurrentMonth: true }),
  );
});

it("accessibility label has the date and event count", async () => {
  await month();
  expect(screen.getByTestId("calendar-22-month-cell")).toHaveProp(
    "accessibilityLabel",
    "October 22, 2026, 9 events",
  );
});

it("selectable: pressing another day calls onDateClick and selects it (wide)", async () => {
  const onDateClick = jest.fn<void, [Date]>();
  await month({ selectable: true, onDateClick }, { width: 1194, height: 834 });
  await fireEvent.press(screen.getByTestId("calendar-14-month-cell"));
  expect(DateTime.fromJSDate(onDateClick.mock.calls[0]![0]).toISODate()).toBe(
    "2026-10-14",
  );
  expect(screen.getByTestId("calendar-14-month-label")).toHaveStyle({
    borderColor: PALETTE.light.primary,
  });
});

it("theme.today overrides the palette on today's cell", async () => {
  await month({ theme: { today: { bgColor: "#ffe4e6" } } });
  expect(screen.getByTestId("calendar-22-month-cell")).toHaveStyle({
    backgroundColor: "#ffe4e6",
  });
});

it("styles.tableDate is applied last, over theme colours", async () => {
  await month({
    theme: { today: { bgColor: "#ffe4e6" } },
    styles: { tableDate: { backgroundColor: "#fafafa" } },
  });
  expect(screen.getByTestId("calendar-22-month-cell")).toHaveStyle({
    backgroundColor: "#fafafa",
  });
});

it("review focus 5: today moves after midnight on resume", async () => {
  useFrozenClock("2026-10-22T23:59:00");
  await month();
  await emitAppState("background");
  jest.setSystemTime(new Date("2026-10-23T08:00:00"));
  await emitAppState("active");
  expect(screen.getByTestId("calendar-23-month-label")).toHaveStyle({
    backgroundColor: PALETTE.light.primary,
  });
});

it("Calendar.View and Calendar.MonthView render in compound mode", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)}>
      <Calendar.MonthView />
    </Calendar>,
  );
  expect(screen.getByTestId("calendar-month-view")).toBeOnTheScreen();
  expect(Calendar.View).toBeDefined();
});

it("hidden adjacent cells stay clickable (port spec §4.2)", async () => {
  const onDateClick = jest.fn<void, [Date]>();
  const onSlotClick = jest.fn();
  await month({
    showAdjacentMonths: false,
    selectable: true,
    creatable: true,
    slotPressMode: "longPress",
    onDateClick,
    onSlotClick,
  });
  const sep27 = () => screen.getAllByTestId("calendar-27-month-cell")[0]!;
  await fireEvent(sep27(), "longPress");
  expect(onSlotClick).toHaveBeenCalledTimes(1);
  await fireEvent.press(sep27());
  expect(DateTime.fromJSDate(onDateClick.mock.calls[0]![0]).toISODate()).toBe(
    "2026-09-27",
  );
});
