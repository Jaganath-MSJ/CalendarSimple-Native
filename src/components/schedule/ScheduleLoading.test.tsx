import type { ReactElement } from "react";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("pull-to-refresh calls onRefresh once", async () => {
  const onRefresh = jest.fn();
  await renderCalendar(
    <Calendar
      view="schedule"
      events={OCT_2026_EVENTS}
      selectedDate={new Date(2026, 9, 22)}
      onRefresh={onRefresh}
      refreshing={false}
    />,
  );
  const list = screen.getByTestId("calendar-schedule-view");
  const control = list.props.refreshControl as ReactElement<{
    onRefresh: () => void;
  }>;
  await act(() => control.props.onRefresh());
  expect(onRefresh).toHaveBeenCalledTimes(1);
});

it("end reached extends the window once per range", async () => {
  const onEndReached = jest.fn();
  const spy = jest.fn<void, [Date, Date, string]>();
  await renderCalendar(
    <Calendar
      view="schedule"
      events={OCT_2026_EVENTS}
      selectedDate={new Date(2026, 9, 22)}
      onEndReached={onEndReached}
      onDateRangeChange={spy}
    />,
  );
  const list = screen.getByTestId("calendar-schedule-view");
  await fireEvent(list, "endReached");
  await fireEvent(list, "endReached");
  await act(() => jest.advanceTimersByTime(20));
  expect(onEndReached).toHaveBeenCalledTimes(1);
  expect(DateTime.fromJSDate(spy.mock.calls.at(-1)![1]).toISODate()).toBe(
    "2026-12-20",
  );
});

it("no RefreshControl without onRefresh", async () => {
  await renderCalendar(<Calendar view="schedule" events={[]} />);
  expect(
    screen.getByTestId("calendar-schedule-view").props.refreshControl,
  ).toBeUndefined();
});

it("empty extensions do not stall: each scroll re-arms the next window", async () => {
  const onEndReached = jest.fn();
  const spy = jest.fn<void, [Date, Date, string]>();
  await renderCalendar(
    <Calendar
      view="schedule"
      events={[]}
      selectedDate={new Date(2026, 9, 22)}
      onEndReached={onEndReached}
      onDateRangeChange={spy}
    />,
  );
  const list = screen.getByTestId("calendar-schedule-view");
  const scroll = { nativeEvent: { contentOffset: { x: 0, y: 10 } } };
  await fireEvent(list, "endReached");
  await fireEvent.scroll(list, scroll);
  await fireEvent(list, "endReached");
  await act(() => jest.advanceTimersByTime(20));
  expect(onEndReached).toHaveBeenCalledTimes(2);
  expect(DateTime.fromJSDate(spy.mock.calls.at(-1)![1]).toISODate()).toBe(
    "2027-01-19",
  );
});
