/**
 * @file `<CalendarGestures>`: turns on gestures for the calendars inside it.
 */
import type { ReactNode } from "react";
import {
  GestureAdapterProvider,
  type GestureAdapter,
} from "../context/GestureAdapterContext";
import { DraggableEvent } from "./DraggableEvent";

const ADAPTER: GestureAdapter = { EventWrapper: DraggableEvent };

export interface CalendarGesturesProps {
  children: ReactNode;
}

/**
 * Wrap one or more calendars to drag events with a long press (`draggable`,
 * `onEventDrop`). Needs `react-native-gesture-handler` (a
 * `GestureHandlerRootView` above it) and `react-native-reanimated`.
 */
export function CalendarGestures({ children }: CalendarGesturesProps) {
  return (
    <GestureAdapterProvider value={ADAPTER}>{children}</GestureAdapterProvider>
  );
}
