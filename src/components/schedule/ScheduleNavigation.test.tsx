import { SectionList } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("next moves the window one day and reports the range", async () => {
  const spy = jest.fn<void, [Date, Date, string]>();
  await renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      onDateRangeChange={spy}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-header-next-btn"));
  await act(() => jest.advanceTimersByTime(20));
  expect(screen.getAllByTestId(/-schedule-section$/)[0]!.props.testID).toBe(
    "calendar-2026-10-23-schedule-section",
  );
  const [s, e, v] = spy.mock.calls.at(-1)!;
  expect([
    DateTime.fromJSDate(s).toISODate(),
    DateTime.fromJSDate(e).toISODate(),
    v,
  ]).toEqual(["2026-10-23", "2026-11-21", "schedule"]);
});

it("header title follows the window", async () => {
  await renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
    />,
  );
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "Oct - Nov 2026",
  );
});

it("scrolls back to the top when the selected date changes", async () => {
  const scrollTo = jest
    .spyOn(SectionList.prototype, "scrollToLocation")
    .mockImplementation(() => {});
  await renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
    />,
  );
  expect(scrollTo).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId("calendar-header-next-btn"));
  expect(scrollTo).toHaveBeenCalledWith(
    expect.objectContaining({ sectionIndex: 0, itemIndex: 0, viewOffset: 0 }),
  );
  scrollTo.mockRestore();
});
