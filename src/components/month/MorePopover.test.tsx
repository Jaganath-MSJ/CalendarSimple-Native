import { fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";
import type { CalendarEvent } from "../../types";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const wide = { width: 1194, height: 834 };

it("+ 6 more on 22 Oct reports the hidden events and opens the popover", async () => {
  const onMoreClick = jest.fn<void, [Date, CalendarEvent[]]>();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      onMoreClick={onMoreClick}
    />,
    wide,
  );
  expect(screen.getByTestId("calendar-22-more-events")).toHaveTextContent(
    "+ 6 more",
  );
  await fireEvent.press(screen.getByTestId("calendar-22-more-events"));
  const [date, hidden] = onMoreClick.mock.calls[0]!;
  expect(DateTime.fromJSDate(date).toISODate()).toBe("2026-10-22");
  expect(hidden.map((e) => e.title)).toEqual([
    "Sam's birthday",
    "Payroll",
    "Stand-up",
    "Design review",
    "Interview",
    "Gym",
  ]);
  expect(screen.getAllByTestId(/-popover-item$/)).toHaveLength(9);
  expect(screen.getByText("THU, 22 OCT")).toBeOnTheScreen();
  expect(screen.getByTestId("calendar-popover-content")).toHaveProp(
    "accessibilityLabel",
    "Events on Thu, 22 Oct",
  );
});

it("popover item press calls onEventClick and closes", async () => {
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      onEventClick={onEventClick}
    />,
    wide,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-more-events"));
  await fireEvent.press(screen.getByTestId("calendar-o19-popover-item")); // Stand-up
  expect(onEventClick.mock.calls[0]![0].title).toBe("Stand-up");
  expect(screen.queryByTestId("calendar-popover-content")).toBeNull();
});

it("Android back closes the popover", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
    wide,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-more-events"));
  await fireEvent(screen.getByTestId("calendar-popover"), "requestClose");
  expect(screen.queryByTestId("calendar-popover-content")).toBeNull();
});

it("#20: showMorePopover={false} only calls back", async () => {
  const onMoreClick = jest.fn();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      showMorePopover={false}
      onMoreClick={onMoreClick}
    />,
    wide,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-more-events"));
  expect(onMoreClick).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId("calendar-popover-content")).toBeNull();
});

it("arrows mark events continuing from or past the day", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
    wide,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-more-events"));
  // Design sprint (19–22) started before; Hackathon (22–23) ends after.
  expect(
    screen.getByTestId("calendar-o8-popover-item-arrow-start"),
  ).toBeOnTheScreen();
  expect(screen.queryByTestId("calendar-o8-popover-item-arrow-end")).toBeNull();
  expect(
    screen.getByTestId("calendar-o16-popover-item-arrow-end"),
  ).toBeOnTheScreen();
});
