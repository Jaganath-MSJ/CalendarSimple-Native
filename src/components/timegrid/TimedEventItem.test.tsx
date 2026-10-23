import { fireEvent, screen, within } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import type { CalendarEvent, CalendarProps } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

// Day view, phone: column width 390 − 60 = 330.
const day = (props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      {...props}
    />,
  );

it("tiles the 11:00 overlap", async () => {
  await day();
  expect(screen.getByTestId("calendar-o20-day-event-item")).toHaveStyle({
    top: 660,
    left: 0,
    width: 163,
  });
  expect(screen.getByTestId("calendar-o21-day-event-item")).toHaveStyle({
    top: 690,
    left: 165,
    width: 163,
  });
});

it("stacks with eventOverlapOffset (percent)", async () => {
  await day({ eventOverlapOffset: 20 });
  expect(screen.getByTestId("calendar-o21-day-event-item")).toHaveStyle({
    left: 66,
    width: 262,
  });
});

it("tiny layout for the 15-minute stand-up", async () => {
  await day();
  expect(screen.getByTestId("calendar-o19-day-event-item")).toHaveStyle({
    height: 15,
  });
});

it("#14A: no endDate draws 15 px", async () => {
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      events={[{ id: "p", title: "Ping", startDate: "2026-10-22T09:00:00" }]}
    />,
  );
  expect(screen.getByTestId("calendar-p-day-event-item")).toHaveStyle({
    height: 15,
  });
});

it("labels the event with title and tooltip", async () => {
  await day();
  expect(
    screen.getByTestId("calendar-o20-day-event-item").props.accessibilityLabel,
  ).toMatch(/^Design review, /);
});

it("press and long press call back with the event", async () => {
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  const onEventLongPress = jest.fn<void, [CalendarEvent]>();
  await day({ onEventClick, onEventLongPress });
  await fireEvent.press(screen.getByTestId("calendar-o20-day-event-item"));
  await fireEvent(
    screen.getByTestId("calendar-o20-day-event-item"),
    "longPress",
  );
  expect([
    onEventClick.mock.calls[0]![0].id,
    onEventLongPress.mock.calls[0]![0].id,
  ]).toEqual(["o20", "o20"]);
});

describe("narrow week columns (390 wide: 330 / 7 per day)", () => {
  const week = () =>
    renderCalendar(
      <Calendar
        view="week"
        selectedDate={new Date(2026, 9, 22)}
        events={OCT_2026_EVENTS}
      />,
    );

  it("half-width overlaps draw no text fragments", async () => {
    await week();
    // ~22 px wide: no room for even two characters.
    const item = screen.getByTestId("calendar-o13-day-event-item");
    expect(within(item).queryByText(/.+/)).toBeNull();
  });

  it("small events show the title only, never the time", async () => {
    await week();
    const item = screen.getByTestId("calendar-o12-day-event-item");
    expect(within(item).queryByText("16:00")).toBeNull();
  });

  it("full-width tall events keep their title (600 wide)", async () => {
    await renderCalendar(
      <Calendar
        view="week"
        selectedDate={new Date(2026, 9, 22)}
        events={OCT_2026_EVENTS}
      />,
      { width: 600, height: 844 },
    );
    const item = screen.getByTestId("calendar-o27-day-event-item");
    expect(within(item).getByText("Hike")).toBeOnTheScreen();
  });
});

it("timed events crossing midnight draw a segment on each day", async () => {
  await renderCalendar(
    <Calendar
      view="week"
      selectedDate={new Date(2026, 9, 22)}
      events={[
        {
          id: "n",
          title: "Night",
          startDate: "2026-10-21T22:00:00",
          endDate: "2026-10-22T02:00:00",
        },
      ]}
    />,
  );
  expect(screen.getAllByTestId("calendar-n-day-event-item")).toHaveLength(2);
});
