import { fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";
import { MONTH_METRICS } from "../../core";
import { getMetrics } from "../../theme";
import type { CalendarProps } from "../../types";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const phone = (props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      {...props}
    />,
    { width: 390, height: 844 },
  );

it("draws 6 px bars without text", async () => {
  await phone();
  // Hackathon
  expect(screen.getByTestId("calendar-o16-month-event-item")).toHaveStyle({
    height: 6,
  });
  expect(screen.queryByText("Hackathon")).toBeNull();
});

it("phone bars use the event colour (style.backgroundColor)", async () => {
  await phone();
  // Design offsite (#15803d)
  expect(screen.getAllByTestId("calendar-o5-month-event-item")[0]).toHaveStyle({
    backgroundColor: "#15803d",
  });
});

it("caps phone bars at 3 per day; 22 Oct shows +6", async () => {
  await phone();
  expect(screen.getByTestId("calendar-22-more-label")).toHaveTextContent("+6");
});

it("shows +N when maxEvents limits the slots (web hidden rule)", async () => {
  await phone({ maxEvents: 3 });
  expect(screen.getByTestId("calendar-22-more-label")).toHaveTextContent("+6");
  expect(screen.getByTestId("calendar-22-more-label")).toHaveProp(
    "accessibilityLabel",
    "+ 6 more",
  );
});

it("phone has no '+N more' button", async () => {
  await phone({ maxEvents: 3 });
  expect(screen.queryByTestId("calendar-22-more-events")).toBeNull();
});

it("bars are not interactive; a tap on the cell opens the day sheet", async () => {
  const onEventClick = jest.fn();
  await phone({ onEventClick });
  const bar = screen.getByTestId("calendar-o16-month-event-item");
  expect(bar).toHaveProp("pointerEvents", "none");
  expect(bar).not.toHaveProp("accessibilityRole");
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(screen.getByTestId("calendar-day-sheet")).toBeOnTheScreen();
  expect(onEventClick).not.toHaveBeenCalled();
});

it("#9: the phone slot pitch matches the drawn bar pitch", () => {
  const { barHeight, barPitch } = getMetrics("phone").month;
  expect(MONTH_METRICS.phone.eventPitch).toBe(barHeight + 2);
  expect(barPitch).toBe(barHeight + 2);
});
