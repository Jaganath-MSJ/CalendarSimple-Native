import { fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("longPress mode ignores taps for creation", async () => {
  const onSlotClick = jest.fn();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      creatable
      slotPressMode="longPress"
      onSlotClick={onSlotClick}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-2-month-cell"));
  expect(onSlotClick).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId("calendar-2-month-cell"), "longPress");
  expect(onSlotClick).toHaveBeenCalledTimes(1);
});

it("press mode does not create on long press", async () => {
  const onSlotClick = jest.fn();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      creatable
      onSlotClick={onSlotClick}
    />,
  );
  await fireEvent(screen.getByTestId("calendar-2-month-cell"), "longPress");
  expect(onSlotClick).not.toHaveBeenCalled();
});

it("longPress mode keeps onDateClick and the day sheet on press", async () => {
  const onDateClick = jest.fn();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      selectable
      creatable
      slotPressMode="longPress"
      onDateClick={onDateClick}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-23-month-cell"));
  expect(onDateClick).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("calendar-day-sheet")).toBeOnTheScreen();
});
