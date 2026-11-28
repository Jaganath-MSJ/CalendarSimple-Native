import type { ReactElement } from "react";
import { View } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import {
  GestureAdapterProvider,
  type DragWrapperProps,
} from "../../context/GestureAdapterContext";
import type { CalendarEvent, EventDropInfo } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const wrapped = new Map<string, DragWrapperProps>();
function FakeWrapper(props: DragWrapperProps) {
  const id = (props.children as ReactElement<{ testID?: string }>).props.testID;
  if (id) wrapped.set(id, props);
  return <View style={props.style}>{props.children}</View>;
}

// Month lays out copies; the app's objects are never written to, and the
// callbacks get them back (calendar-simple 4b0423b).
it("Month leaves the app's events alone and reports them as passed in", async () => {
  const event: CalendarEvent = Object.freeze({
    id: "m",
    title: "Meeting",
    startDate: "2026-10-22T09:00:00",
    endDate: "2026-10-22T10:00:00",
  });
  const onEventDrop = jest.fn<void, [EventDropInfo]>();
  const onEventClick = jest.fn<void, [CalendarEvent]>();
  await renderCalendar(
    <GestureAdapterProvider value={{ EventWrapper: FakeWrapper }}>
      <Calendar
        selectedDate={new Date(2026, 9, 22)}
        events={[event]}
        draggable
        onEventDrop={onEventDrop}
        onEventClick={onEventClick}
      />
    </GestureAdapterProvider>,
    { width: 1194, height: 844 },
  );
  const id = "calendar-m-month-event-item";
  await fireEvent.press(screen.getByTestId(id));
  const move = wrapped.get(id)!.move!;
  await act(() => move.onEnd(move.snapX, 0));

  expect(Object.keys(event)).toEqual(["id", "title", "startDate", "endDate"]);
  expect(onEventClick.mock.calls[0]![0]).toBe(event);
  expect(onEventDrop.mock.calls[0]![0].event).toBe(event);
});
