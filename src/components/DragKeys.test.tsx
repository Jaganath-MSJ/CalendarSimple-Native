import { Platform } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "./Calendar";
import type { CalendarEvent, EventDropInfo, EventResizeInfo } from "../types";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

// Web keys on a focused event (calendar-simple): Alt+arrows move,
// Alt+Shift+↑/↓ resize the end. They need no gestures entry.
const meeting: CalendarEvent = {
  id: "m",
  title: "Meeting",
  startDate: "2026-10-22T09:00:00",
  endDate: "2026-10-22T10:00:00",
};
const hm = (d: Date) => DateTime.fromJSDate(d).toFormat("yyyy-MM-dd HH:mm");
const press = (testID: string, key: string, mods: object = {}) =>
  fireEvent(screen.getByTestId(testID), "keyDown", {
    nativeEvent: { key, altKey: true, ...mods },
    preventDefault: () => {},
  });

let os: jest.ReplaceProperty<typeof Platform.OS>;
beforeEach(() => {
  os = jest.replaceProperty(Platform, "OS", "web");
});
afterEach(() => os.restore());

async function day(extra: Partial<Parameters<typeof Calendar>[0]> = {}) {
  const onEventDrop = jest.fn<void, [EventDropInfo]>();
  const onEventResize = jest.fn<void, [EventResizeInfo]>();
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      events={[meeting]}
      draggable
      onEventDrop={onEventDrop}
      resizable
      onEventResize={onEventResize}
      {...extra}
    />,
  );
  return { onEventDrop, onEventResize };
}
const item = "calendar-m-day-event-item";

it("time grid: Alt+↑/↓ move by the snap, Alt+←/→ by a day", async () => {
  const { onEventDrop } = await day();
  await press(item, "ArrowDown");
  await press(item, "ArrowUp");
  await press(item, "ArrowRight");
  await press(item, "ArrowLeft");
  expect(onEventDrop.mock.calls.map((c) => hm(c[0].start))).toEqual([
    "2026-10-22 09:15",
    "2026-10-22 08:45",
    "2026-10-23 09:00",
    "2026-10-21 09:00",
  ]);
});

it("Alt+Shift+↓ makes it longer; keys without Alt do nothing", async () => {
  const { onEventDrop, onEventResize } = await day();
  await press(item, "ArrowDown", { shiftKey: true });
  expect(hm(onEventResize.mock.calls[0]![0].end)).toBe("2026-10-22 10:15");
  await press(item, "ArrowDown", { altKey: false });
  expect(onEventDrop).not.toHaveBeenCalled();
});

it("lists its keys in aria-keyshortcuts", async () => {
  await day();
  expect(screen.getByTestId(item).props["aria-keyshortcuts"]).toBe(
    "Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowUp Alt+Shift+ArrowDown",
  );
});

it("right to left: Alt+← is the next day", async () => {
  const { onEventDrop } = await day({ locale: "ar", direction: "rtl" });
  await press(item, "ArrowLeft");
  expect(hm(onEventDrop.mock.calls[0]![0].start)).toBe("2026-10-23 09:00");
});

it("Month: Alt+↑/↓ move by a week, keeping the time", async () => {
  const onEventDrop = jest.fn<void, [EventDropInfo]>();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={[meeting]}
      draggable
      onEventDrop={onEventDrop}
    />,
    { width: 1194, height: 844 },
  );
  const chip = "calendar-m-month-event-item";
  await press(chip, "ArrowDown");
  await press(chip, "ArrowRight");
  expect(onEventDrop.mock.calls.map((c) => hm(c[0].start))).toEqual([
    "2026-10-29 09:00",
    "2026-10-23 09:00",
  ]);
  expect(screen.getByTestId(chip).props["aria-keyshortcuts"]).toBe(
    "Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight",
  );
});

it("keyboardNavigation={false} turns the event keys off too", async () => {
  const { onEventDrop } = await day({ keyboardNavigation: false });
  expect(screen.getByTestId(item).props["aria-keyshortcuts"]).toBeUndefined();
  await press(item, "ArrowRight");
  expect(onEventDrop).not.toHaveBeenCalled();
});

it("native apps get no key handler", async () => {
  os.restore();
  await day();
  expect(screen.getByTestId(item).props.onKeyDown).toBeUndefined();
});
