import { act, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock(); // 10:40

it("draws the now-line at 10:40 in today's column", async () => {
  await renderCalendar(
    <Calendar
      view="week"
      selectedDate={new Date(2026, 9, 22)}
      showCurrentTime
    />,
  );
  expect(screen.getByTestId("calendar-current-time-line")).toHaveStyle({
    top: 640,
  });
});

it("moves after a minute", async () => {
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      showCurrentTime
    />,
  );
  await act(() => {
    jest.advanceTimersByTime(60_000);
  });
  expect(screen.getByTestId("calendar-current-time-line")).toHaveStyle({
    top: 641,
  });
});

it("hides outside the hour range", async () => {
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      showCurrentTime
      minHour={12}
    />,
  );
  expect(screen.queryByTestId("calendar-current-time-line")).toBeNull();
});

it("is off without showCurrentTime", async () => {
  await renderCalendar(
    <Calendar view="day" selectedDate={new Date(2026, 9, 22)} />,
  );
  expect(screen.queryByTestId("calendar-current-time-line")).toBeNull();
});
