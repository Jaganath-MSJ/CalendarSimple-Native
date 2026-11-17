/**
 * @file `<CalendarGestures>`: turns on gestures for the calendars inside it.
 */
import type { ReactNode } from "react";
import {
  GestureAdapterProvider,
  type GestureAdapter,
} from "../context/GestureAdapterContext";
import { DraggableEvent } from "./DraggableEvent";
import { PinchZoom } from "./PinchZoom";

const ADAPTER: GestureAdapter = {
  EventWrapper: DraggableEvent,
  TimeGridWrapper: PinchZoom,
};

export interface CalendarGesturesProps {
  children: ReactNode;
}

/**
 * Wrap one or more calendars to move and resize events with a long press
 * (`draggable`, `resizable`) and to pinch the time grid (`pinchToZoom`).
 * Needs `react-native-gesture-handler` (a
 * `GestureHandlerRootView` above it) and `react-native-reanimated`.
 */
export function CalendarGestures({ children }: CalendarGesturesProps) {
  return (
    <GestureAdapterProvider value={ADAPTER}>{children}</GestureAdapterProvider>
  );
}
