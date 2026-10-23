import { AccessibilityInfo } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import type { CalendarProps } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const day = (props: Partial<CalendarProps> = {}) =>
  renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      creatable
      {...props}
    />,
  );
const pressAt = (y: number, ev = "press") =>
  fireEvent(screen.getByTestId("calendar-day-column"), ev, {
    nativeEvent: { locationY: y },
  });

it("press creates a one-hour slot", async () => {
  const onSlotClick = jest.fn<void, [Date, Date]>();
  await day({ onSlotClick });
  await pressAt(840);
  const [s, e] = onSlotClick.mock.calls[0]!.map((d) =>
    DateTime.fromJSDate(d).toFormat("HH:mm"),
  );
  expect([s, e]).toEqual(["14:00", "15:00"]);
});

it("clamps the slot to the last visible hour", async () => {
  const onSlotClick = jest.fn<void, [Date, Date]>();
  await day({ onSlotClick, minHour: 8, maxHour: 10 });
  await pressAt(500);
  expect(
    DateTime.fromJSDate(onSlotClick.mock.calls[0]![0]).toFormat("HH:mm"),
  ).toBe("09:00");
});

it("longPress mode ignores taps", async () => {
  const onSlotClick = jest.fn<void, [Date, Date]>();
  await day({ onSlotClick, slotPressMode: "longPress" });
  await pressAt(840);
  expect(onSlotClick).not.toHaveBeenCalled();
  await pressAt(840, "longPress");
  expect(onSlotClick).toHaveBeenCalledTimes(1);
});

it("screen-reader mode renders labelled hour slots", async () => {
  jest
    .spyOn(AccessibilityInfo, "isScreenReaderEnabled")
    .mockResolvedValue(true);
  await day({ onSlotClick: jest.fn() });
  expect(await screen.findByTestId("calendar-2026-10-22-14-slot")).toHaveProp(
    "accessibilityLabel",
    "Create event at 14:00, Thu, 22 Oct",
  );
});

it("renderHourCell gets each slot start", async () => {
  const spy = jest.fn((_: Date) => null);
  await day({ renderHourCell: spy, minHour: 8, maxHour: 10 });
  const times = spy.mock.calls
    .map(([d]) => DateTime.fromJSDate(d))
    .map((d) => d.toFormat("HH:mm"));
  expect(times).toEqual(["08:00", "09:00"]);
});
