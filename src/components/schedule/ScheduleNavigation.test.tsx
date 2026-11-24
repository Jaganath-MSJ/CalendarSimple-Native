import { SectionList } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { dateFn, getLastEventDay } from "../../core";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
afterEach(() => jest.restoreAllMocks());

/** Day sections Schedule shows: every day each event covers, in order. */
const sectionDays = () => {
  const days = new Set<string>();
  for (const e of OCT_2026_EVENTS) {
    const last = getLastEventDay(e);
    for (
      let d = dateFn(e.startDate).startOf("day");
      d <= last;
      d = d.plus({ days: 1 })
    )
      days.add(d.toISODate()!);
  }
  return [...days].sort();
};

// Schedule lists every event (1.1); the title covers them all, and changing
// the selected date scrolls to it instead of moving a window.

it("header title spans every event", async () => {
  await renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
    />,
  );
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "Oct 2026",
  );
});

it("a new selectedDate scrolls to its day (first on or after it)", async () => {
  const scrollTo = jest
    .spyOn(SectionList.prototype, "scrollToLocation")
    .mockImplementation(() => {});
  const ui = (d: Date) => (
    <Calendar view="schedule" selectedDate={d} events={OCT_2026_EVENTS} />
  );
  const { rerender } = await renderCalendar(ui(new Date(2026, 9, 22)));
  expect(scrollTo).not.toHaveBeenCalled();
  await rerender(ui(new Date(2026, 9, 30)));
  const days = sectionDays();
  expect(scrollTo.mock.calls.at(-1)![0].sectionIndex).toBe(
    days.findIndex((d) => d >= "2026-10-30"),
  );
  scrollTo.mockRestore();
});

it("switching to Schedule keeps the date and does not jump", async () => {
  const scrollTo = jest
    .spyOn(SectionList.prototype, "scrollToLocation")
    .mockImplementation(() => {});
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
  );
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  await fireEvent.press(screen.getByTestId("calendar-menu-option-schedule"));
  await act(() => jest.advanceTimersByTime(20));
  expect(screen.getByTestId("calendar-schedule-view")).toBeOnTheScreen();
  expect(scrollTo).not.toHaveBeenCalled();
});
