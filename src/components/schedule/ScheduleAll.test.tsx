import { Platform, SectionList, Text } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import type { CalendarEvent } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock(); // 2026-10-22 10:40

// Since 1.1 Schedule lists every event, like calendar-simple: no window, no
// Prev/Next; Today and date picks scroll to the selected date.
const events: CalendarEvent[] = [
  { id: "sep", title: "Kickoff", startDate: "2026-09-05" },
  { id: "oct", title: "Review", startDate: "2026-10-25T09:00:00" },
  { id: "dec", title: "Launch", startDate: "2026-12-01" },
];

let scrollTo: jest.SpyInstance;
beforeEach(() => {
  scrollTo = jest
    .spyOn(SectionList.prototype, "scrollToLocation")
    .mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
const sectionsScrolledTo = (): number[] =>
  scrollTo.mock.calls.map((c: [{ sectionIndex: number }]) => c[0].sectionIndex);

const schedule = (extra: Partial<Parameters<typeof Calendar>[0]> = {}) =>
  renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={events}
      {...extra}
    />,
  );

it("lists every event, months away from the selected date", async () => {
  await schedule();
  for (const title of ["Kickoff", "Review", "Launch"])
    expect(screen.getByText(title)).toBeOnTheScreen();
});

it("has no Prev/Next; the title spans all events", async () => {
  await schedule();
  expect(screen.queryByTestId("calendar-header-prev-btn")).toBeNull();
  expect(screen.queryByTestId("calendar-header-next-btn")).toBeNull();
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "Sep - Dec 2026",
  );
  expect(
    screen.getByTestId("calendar-header-title").props.accessibilityActions,
  ).toBeUndefined();
});

it("does not scroll on mount unless autoScrollToCurrentTime", async () => {
  await schedule();
  expect(scrollTo).not.toHaveBeenCalled();
});

it("autoScrollToCurrentTime opens at the first day on or after the date", async () => {
  await schedule({ autoScrollToCurrentTime: true });
  // Sections: 5 Sep, 25 Oct, 1 Dec; the 22nd's first day on or after is 25 Oct.
  expect(sectionsScrolledTo()).toEqual([1]);
});

it("Today scrolls, even to the same date, without onNavigate", async () => {
  const onNavigate = jest.fn();
  await schedule({ selectedDate: new Date(2026, 9, 22, 10, 40), onNavigate });
  await fireEvent.press(screen.getByTestId("calendar-header-today-btn"));
  await fireEvent.press(screen.getByTestId("calendar-header-today-btn"));
  expect(sectionsScrolledTo()).toEqual([1, 1]);
  expect(onNavigate).not.toHaveBeenCalled();
});

it("does not scroll again when only the events array is new", async () => {
  // A refresh, a parent re-render or re-expanded series give a new array.
  const { rerender } = await schedule({ autoScrollToCurrentTime: true });
  await rerender(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={[...events]}
      autoScrollToCurrentTime
    />,
  );
  expect(sectionsScrolledTo()).toEqual([1]);
  // A different target day does scroll.
  await rerender(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={events.filter((e) => e.id !== "oct")}
      autoScrollToCurrentTime
    />,
  );
  expect(sectionsScrolledTo()).toEqual([1, 1]);
});

it("a far section that fails to scroll is approached, then retried", async () => {
  // renderEvent: rows have no fixed height, so a far section may fail.
  const scrollTo = jest.fn();
  jest
    .spyOn(SectionList.prototype, "getScrollResponder")
    .mockImplementation(() => ({ scrollTo }) as never);
  await schedule({
    renderEvent: (e) => <Text>{e.title}</Text>,
    autoScrollToCurrentTime: true,
  });
  const list = screen.getByTestId("calendar-schedule-view");
  const fail = list.props.onScrollToIndexFailed as (info: {
    index: number;
    averageItemLength: number;
  }) => void;
  await act(() => fail({ index: 40, averageItemLength: 50 }));
  expect(scrollTo).toHaveBeenCalledWith({ y: 2000, animated: false });
  await act(() => jest.advanceTimersByTime(100));
  expect(sectionsScrolledTo()).toEqual([1, 1]);
});

it("past the last event, scrolls to the last day", async () => {
  await schedule({
    selectedDate: new Date(2027, 0, 10),
    autoScrollToCurrentTime: true,
  });
  expect(sectionsScrolledTo()).toEqual([2]);
});

it("warns in development when removed props are passed", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  await schedule({
    ...({ scheduleDays: 30, onEndReached: () => {} } as object),
  });
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining("scheduleDays, onEndReached: removed in 1.1"),
  );
  warn.mockRestore();
});

it("web: PageDown does nothing in Schedule", async () => {
  const os = jest.replaceProperty(Platform, "OS", "web");
  const onNavigate = jest.fn();
  await schedule({ onNavigate });
  const preventDefault = jest.fn();
  await fireEvent(
    screen.getByTestId("calendar-schedule-view").parent!,
    "keyDown",
    { nativeEvent: { key: "PageDown" }, preventDefault },
  );
  expect(onNavigate).not.toHaveBeenCalled();
  expect(preventDefault).not.toHaveBeenCalled();
  os.restore();
});
