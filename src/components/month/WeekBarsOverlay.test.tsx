import { Dimensions, Text } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";
import { getMetrics } from "../../theme";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const wide = { width: 1194, height: 834 };

it("#10: a 4-day chip spans 4 cells minus 8 and starts 4 px into its column", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
    wide,
  );
  const cellW = 1194 / 7;
  // Design sprint
  expect(screen.getByTestId("calendar-o8-month-event-item")).toHaveStyle({
    left: cellW + 4,
    width: 4 * cellW - 8,
  });
});

it("#10: subtracts the week-number gutter", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      showWeekNumbers
    />,
    wide,
  );
  const cellW = (1194 - 36) / 7;
  expect(screen.getByTestId("calendar-o8-month-event-item")).toHaveStyle({
    left: 36 + cellW + 4,
    width: 4 * cellW - 8,
  });
});

it("stacks slots below the label area", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
    wide,
  );
  // Design sprint is in slot 1 of its week: label + 8 + 1 × (chip + 2)
  // (24 + 8 + 26 = 58 at font scale 1).
  const { labelSize, chipHeight } = getMetrics(
    "wide",
    Dimensions.get("window").fontScale,
  ).month;
  expect(screen.getByTestId("calendar-o8-month-event-item")).toHaveStyle({
    top: labelSize + 8 + chipHeight + 2,
    height: chipHeight,
  });
});

it("passes the app's own event object to onEventClick and onEventLongPress", async () => {
  const onEventClick = jest.fn<void, [unknown]>();
  const onEventLongPress = jest.fn<void, [unknown]>();
  const events = [
    { id: "m1", title: "Room", startDate: "2026-10-05T10:00:00", roomId: "R2" },
  ];
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 5)}
      events={events}
      onEventClick={onEventClick}
      onEventLongPress={onEventLongPress}
    />,
    wide,
  );
  await fireEvent.press(screen.getByTestId("calendar-m1-month-event-item"));
  expect(onEventClick).toHaveBeenCalledWith(events[0]);
  expect(onEventClick.mock.calls[0]![0]).toBe(events[0]);
  await fireEvent(
    screen.getByTestId("calendar-m1-month-event-item"),
    "longPress",
  );
  expect(onEventLongPress.mock.calls[0]![0]).toBe(events[0]);
});

it("labels the chip with the title and tooltip", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 5)}
      events={[{ id: "u", title: "", startDate: "2026-10-05" }]}
    />,
    wide,
  );
  expect(screen.getByTestId("calendar-u-month-event-item")).toHaveProp(
    "accessibilityLabel",
    "No title,  (2026-10-05)",
  );
});

it("renderEvent replaces the chip content", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 5)}
      events={[{ id: "r", title: "x", startDate: "2026-10-05" }]}
      renderEvent={(e) => <Text>{`custom ${e.id}`}</Text>}
    />,
    wide,
  );
  expect(screen.getByText("custom r")).toBeOnTheScreen();
});

it("event style colours apply, other keys are dropped (#18)", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 5)}
      events={[
        {
          id: "s",
          title: "Styled",
          startDate: "2026-10-05",
          style: { backgroundColor: "#000000" },
        },
      ]}
    />,
    wide,
  );
  expect(screen.getByTestId("calendar-s-month-event-item")).toHaveStyle({
    backgroundColor: "#000000",
  });
});
