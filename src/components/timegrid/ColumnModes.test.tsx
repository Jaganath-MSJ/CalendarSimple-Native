import { screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("swipe on: week columns fit the phone width", async () => {
  await renderCalendar(
    <Calendar view="week" selectedDate={new Date(2026, 9, 22)} />,
  );
  expect(screen.queryByTestId("calendar-time-grid-hscroll")).toBeNull();
  expect(screen.getAllByTestId("calendar-day-column")[0]).toHaveStyle({
    width: 330 / 7,
  });
});

it("swipe off on a phone: one day per screen with snapping", async () => {
  await renderCalendar(
    <Calendar
      view="week"
      selectedDate={new Date(2026, 9, 22)}
      swipeNavigation={false}
    />,
  );
  expect(screen.getByTestId("calendar-time-grid-hscroll")).toHaveProp(
    "snapToInterval",
    300,
  );
});
