import type { ReactElement } from "react";
import { View } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "./Calendar";
import {
  GestureAdapterProvider,
  type DragWrapperProps,
} from "../context/GestureAdapterContext";
import type { CalendarEvent } from "../types";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

// On web the event's press still fires when the mouse is released after a
// drag (native gesture handlers cancel it): that release must not count as a
// click or a long press.
const wrapped = new Map<string, DragWrapperProps>();
function FakeWrapper(props: DragWrapperProps) {
  const id = (props.children as ReactElement<{ testID?: string }>).props.testID;
  if (id) wrapped.set(id, props);
  return <View style={props.style}>{props.children}</View>;
}
const ADAPTER = { EventWrapper: FakeWrapper };
beforeEach(() => wrapped.clear());

const meeting: CalendarEvent = {
  id: "m",
  title: "Meeting",
  startDate: "2026-10-22T09:00:00",
  endDate: "2026-10-22T10:00:00",
};

for (const [view, id] of [
  ["day", "calendar-m-day-event-item"],
  ["month", "calendar-m-month-event-item"],
] as const)
  it(`${view}: the press that ends a drag is not a click; the next tap is`, async () => {
    const onEventClick = jest.fn();
    const onEventLongPress = jest.fn();
    await renderCalendar(
      <GestureAdapterProvider value={ADAPTER}>
        <Calendar
          view={view}
          selectedDate={new Date(2026, 9, 22)}
          events={[meeting]}
          draggable
          onEventDrop={() => {}}
          onEventClick={onEventClick}
          onEventLongPress={onEventLongPress}
        />
      </GestureAdapterProvider>,
      // Month chips are draggable at the wide breakpoint (phones show bars).
      { width: 1194, height: 844 },
    );
    const item = () => screen.getByTestId(id);

    // Press, drag, release: the press handlers still fire (as on web).
    await fireEvent(item(), "pressIn");
    await act(() => wrapped.get(id)!.onDragStart());
    await fireEvent(item(), "longPress");
    await act(() => wrapped.get(id)!.move!.onEnd(0, 0));
    await fireEvent.press(item());
    expect(onEventClick).not.toHaveBeenCalled();
    expect(onEventLongPress).not.toHaveBeenCalled();

    // A plain tap afterwards is a click again.
    await fireEvent(item(), "pressIn");
    await fireEvent.press(item());
    expect(onEventClick).toHaveBeenCalledTimes(1);
    await fireEvent(item(), "pressIn");
    await fireEvent(item(), "longPress");
    expect(onEventLongPress).toHaveBeenCalledTimes(1);
  });
