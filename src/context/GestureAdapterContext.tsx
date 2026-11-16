/**
 * @file Gesture seam (TDD §8.2): the main package draws events through these
 * wrappers when an adapter is provided (`<CalendarGestures>` from
 * `calendar-simple-native/gestures`), so gesture-handler and Reanimated stay
 * out of the main entry. All drop maths stay in the main package.
 */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { DragBounds } from "../core";

/** Props the main package gives a draggable event's wrapper. */
export interface DragWrapperProps {
  /** The event's own element (positioned at the wrapper's origin). */
  children: ReactNode;
  /** The event's absolute frame; the wrapper draws itself there. */
  style: StyleProp<ViewStyle>;
  /** Horizontal step in px (a day column or cell); `0` locks the axis. */
  snapX: number;
  /** Vertical step in px (`dragSnapMinutes` or a week row); `0` locks it. */
  snapY: number;
  /** Offsets the lifted event may reach, in px. */
  bounds: DragBounds;
  /** The drag started (after the long press). */
  onDragStart: () => void;
  /** Released at snapped offsets (px); `(0, 0)` means no move. */
  onDragEnd: (dx: number, dy: number) => void;
  /** The gesture was cancelled by the system. */
  onDragCancel: () => void;
}

export interface GestureAdapter {
  /** Wraps each draggable event (time grids, month chips). */
  EventWrapper?: ComponentType<DragWrapperProps>;
  /** Wraps the time grid's content (pinch to zoom, v1.1). */
  TimeGridWrapper?: ComponentType<{ children: ReactNode }>;
}

const EMPTY: GestureAdapter = {};

const GestureAdapterContext = createContext<GestureAdapter>(EMPTY);

export function GestureAdapterProvider({
  value,
  children,
}: {
  value: GestureAdapter;
  children: ReactNode;
}) {
  return (
    <GestureAdapterContext.Provider value={value}>
      {children}
    </GestureAdapterContext.Provider>
  );
}

/** The current adapter; an empty object by default. */
export function useGestureAdapter(): GestureAdapter {
  return useContext(GestureAdapterContext);
}

/** Whether an event is being dragged (scrolling and paging pause meanwhile). */
interface DragState {
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
}

const DragStateContext = createContext<DragState>({
  dragging: false,
  setDragging: () => {},
});

/** Provided once per calendar (`CalendarContent`). */
export function DragStateProvider({ children }: { children: ReactNode }) {
  const [dragging, setDragging] = useState(false);
  const value = useMemo(() => ({ dragging, setDragging }), [dragging]);
  return (
    <DragStateContext.Provider value={value}>
      {children}
    </DragStateContext.Provider>
  );
}

export function useDragState(): DragState {
  return useContext(DragStateContext);
}
