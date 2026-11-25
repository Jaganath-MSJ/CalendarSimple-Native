import { Text } from "react-native";
import { fireEvent, screen, within } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { eventsFrom } from "../../test-utils/scheduleEvents";
import { PALETTE } from "../../theme/palette";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";
import type { CalendarEvent, CalendarProps } from "../../types";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();
const sched = (props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 22)}
      events={eventsFrom("2026-10-22", OCT_2026_EVENTS)}
      {...props}
    />,
  );

it("lists from the first event's day (no window since 1.1)", async () => {
  await sched({ events: OCT_2026_EVENTS });
  expect(screen.getAllByTestId(/-schedule-section$/)[0]!.props.testID).toBe(
    "calendar-2026-10-01-schedule-section",
  );
});

it("today's number is a filled circle", async () => {
  await sched();
  expect(
    within(
      screen.getByTestId("calendar-2026-10-22-schedule-section"),
    ).getByText("22"),
  ).toHaveStyle({ color: PALETTE.light.onPrimary });
});

it("rows show schedule time and title strings", async () => {
  await sched();
  expect(screen.getByText("9:30 – 9:45")).toBeOnTheScreen();
  // A multi-day event shows its day of the total on each day.
  await sched({
    events: OCT_2026_EVENTS.filter((e) => e.id === "o8"),
  });
  expect(screen.getByText("Design sprint (Day 1/4)")).toBeOnTheScreen();
});

it("separator only between sections", async () => {
  const sep = jest.fn(() => <Text>sep</Text>);
  await renderCalendar(
    <Calendar
      view="schedule"
      selectedDate={new Date(2026, 9, 29)}
      events={[
        { title: "A", startDate: "2026-10-29" },
        { title: "B", startDate: "2026-10-30" },
        { title: "C", startDate: "2026-10-31" },
      ]}
      renderScheduleSeparator={sep}
    />,
  );
  // 29, 30, 31 Oct → 3 sections, 2 separators
  expect(screen.getAllByText("sep")).toHaveLength(2);
});

it("empty state", async () => {
  await sched({ events: [] });
  expect(screen.getByText("No events to display")).toBeOnTheScreen();
});

it("row press calls onEventClick", async () => {
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  await sched({ onEventClick });
  await fireEvent.press(
    screen.getAllByTestId("calendar-o19-schedule-event")[0]!,
  );
  expect(onEventClick.mock.calls[0]![0].title).toBe("Stand-up");
});
