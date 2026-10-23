import { screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { getMetrics } from "../../theme";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("draws all-day events as full-height blocks and no banner", async () => {
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      showAllDayRow={false}
    />,
  );
  const { hourHeight } = getMetrics("phone", 2).timeGrid;
  expect(screen.queryByTestId("calendar-all-day-banner")).toBeNull();
  // Hackathon
  expect(screen.getByTestId("calendar-o16-day-event-item")).toHaveStyle({
    top: 0,
    height: 24 * hourHeight,
  });
});
