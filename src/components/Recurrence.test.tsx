import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "./Calendar";
import type { CalendarEvent } from "../types";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const oct22 = new Date(2026, 9, 22);
const standup: CalendarEvent = {
  id: "standup",
  title: "Standup",
  startDate: "2026-10-05T09:00:00",
  endDate: "2026-10-05T09:15:00",
  rrule: "FREQ=WEEKLY;BYDAY=MO,TH",
  exdates: ["2026-10-26"],
};
const monthItem = (iso: string) =>
  screen.queryByTestId(`calendar-standup::${iso}T09:00:00-month-event-item`);

it("month shows each occurrence, without the excluded one", async () => {
  await renderCalendar(<Calendar selectedDate={oct22} events={[standup]} />, {
    width: 1194,
    height: 844,
  });
  for (const d of ["2026-10-05", "2026-10-08", "2026-10-19", "2026-10-22"])
    expect(monthItem(d)).not.toBeNull();
  expect(monthItem("2026-10-26")).toBeNull();
  // Before the series starts there is nothing (adjacent 28 Sep).
  expect(monthItem("2026-09-28")).toBeNull();
});

it("keeps expanding after navigation", async () => {
  await renderCalendar(<Calendar selectedDate={oct22} events={[standup]} />, {
    width: 1194,
    height: 844,
  });
  for (let i = 0; i < 5; i++)
    await fireEvent.press(screen.getByTestId("calendar-header-next-btn"));
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "March 2027",
  );
  expect(monthItem("2027-03-01")).not.toBeNull();
  expect(monthItem("2027-03-25")).not.toBeNull();
});

it("passes the occurrence to callbacks", async () => {
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={oct22}
      events={[standup]}
      onEventClick={onEventClick}
    />,
  );
  await fireEvent.press(
    screen.getByTestId("calendar-standup::2026-10-22T09:00:00-day-event-item"),
  );
  expect(onEventClick).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "standup::2026-10-22T09:00:00",
      recurringEventId: "standup",
      occurrenceDate: "2026-10-22T09:00:00",
      startDate: "2026-10-22T09:00:00",
      endDate: "2026-10-22T09:15:00",
      title: "Standup",
    }),
  );
});

it("week and schedule show the occurrences in their range", async () => {
  await renderCalendar(
    <Calendar view="week" selectedDate={oct22} events={[standup]} />,
  );
  expect(
    screen.getAllByTestId(/^calendar-standup::.*-day-event-item$/),
  ).toHaveLength(2);
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  await fireEvent.press(screen.getByTestId("calendar-menu-option-schedule"));
  await act(() => jest.advanceTimersByTime(20));
  // The list is virtualised: the first rows are Thu 22, Thu 29 Oct and
  // Mon 2 Nov (Mon 26 Oct is excluded).
  expect(
    screen
      .getAllByTestId(/^calendar-standup::.*-schedule-event$/)
      .slice(0, 3)
      .map((r) => r.props.testID as string),
  ).toEqual([
    "calendar-standup::2026-10-22T09:00:00-schedule-event",
    "calendar-standup::2026-10-29T09:00:00-schedule-event",
    "calendar-standup::2026-11-02T09:00:00-schedule-event",
  ]);
});

it("shows an event with an unsupported rule once and warns", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={oct22}
      events={[
        {
          id: "odd",
          title: "Odd",
          startDate: "2026-10-22T11:00:00",
          endDate: "2026-10-22T12:00:00",
          rrule: "FREQ=HOURLY",
        },
      ]}
    />,
  );
  expect(screen.getByTestId("calendar-odd-day-event-item")).toBeTruthy();
  expect(warn).toHaveBeenCalledWith(
    '[calendar] event "odd": rrule ignored (FREQ=HOURLY is not supported); showing it once.',
  );
  warn.mockRestore();
});
