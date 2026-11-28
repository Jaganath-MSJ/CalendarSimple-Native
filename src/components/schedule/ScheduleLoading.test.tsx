import type { ReactElement } from "react";
import { act, screen } from "@testing-library/react-native";
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

it("no RefreshControl without onRefresh", async () => {
  await renderCalendar(<Calendar view="schedule" events={[]} />);
  expect(
    screen.getByTestId("calendar-schedule-view").props.refreshControl,
  ).toBeUndefined();
});
