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
import type { AxisBounds, DragBounds, ResizeEdge } from "../core";

/** Moving the whole event (`draggable`). */
export interface DragMoveSpec {
  /** Horizontal step in px (a day column or cell); `0` locks the axis. */
  snapX: number;
  /** Vertical step in px (`dragSnapMinutes` or a week row); `0` locks it. */
  snapY: number;
  /** Offsets the lifted event may reach, in px. */
  bounds: DragBounds;
  /** Released at snapped offsets (px); `(0, 0)` means no move. */
  onEnd: (dx: number, dy: number) => void;
}

/** Resizing from an edge (`resizable`, time grids). */
export interface DragResizeSpec {
  /** Vertical step in px (`resizeSnapMinutes`). */
  snapY: number;
  /** Offsets the top edge may reach (px); absent: the top cannot move. */
  top?: AxisBounds;
  /** Offsets the bottom edge may reach (px); absent: it cannot move. */
  bottom?: AxisBounds;
  /** Released with the edge's snapped offset (px); `0` means no change. */
  onEnd: (edge: ResizeEdge, dy: number) => void;
}

/**
 * Props the main package gives a draggable or resizable event's wrapper. A
 * long press near the top or bottom edge resizes (when `resize` allows that
 * edge); anywhere else it moves (when `move` is set).
 */
export interface DragWrapperProps {
  /** The event's own element; it fills the wrapper. */
  children: ReactNode;
  /** The event's absolute frame; the wrapper draws itself there. */
  style: StyleProp<ViewStyle>;
  move?: DragMoveSpec;
  resize?: DragResizeSpec;
  /** A move or resize started (after the long press). */
  onDragStart: () => void;
  /** It ended without a change, or the system cancelled it. */
  onDragCancel: () => void;
  /** The snapped offset changed by a step while dragging (haptics). */
  onStep?: () => void;
}

/** Props the main package gives the time grid's pinch wrapper. */
export interface ZoomWrapperProps {
  /** The grid's content (hour rows and day columns). */
  children: ReactNode;
  /** Current hour height (pt). */
  hourHeight: number;
  minHourHeight: number;
  maxHourHeight: number;
  /** A pinch started (scrolling pauses). */
  onZoomStart: () => void;
  /**
   * Released at `hourHeight` (pt, inside the limits; unchanged when
   * cancelled), with the pinch's focal point `focalY` in the content (pt).
   */
  onZoomEnd: (hourHeight: number, focalY: number) => void;
}

export interface GestureAdapter {
  /** Wraps each draggable event (time grids, month chips). */
  EventWrapper?: ComponentType<DragWrapperProps>;
  /** Wraps the time grid's content (`pinchToZoom`). */
  TimeGridWrapper?: ComponentType<ZoomWrapperProps>;
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

/** Hour height set by pinching, shared by every page of the calendar. */
interface ZoomState {
  /** `undefined` until a pinch sets it. */
  hourHeight?: number;
  setHourHeight: (hourHeight: number) => void;
}

const ZoomStateContext = createContext<ZoomState>({ setHourHeight: () => {} });

/** Provided once per calendar (`CalendarContent`). */
export function ZoomStateProvider({ children }: { children: ReactNode }) {
  const [hourHeight, setHourHeight] = useState<number | undefined>();
  const value = useMemo(() => ({ hourHeight, setHourHeight }), [hourHeight]);
  return (
    <ZoomStateContext.Provider value={value}>
      {children}
    </ZoomStateContext.Provider>
  );
}

export function useZoomState(): ZoomState {
  return useContext(ZoomStateContext);
}
