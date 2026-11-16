/**
 * @file What a draggable or resizable event needs: the gestures wrapper
 * (when an adapter is provided) and the screen-reader actions (always).
 */
import type { ReactNode } from "react";
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  StyleProp,
  ViewStyle,
} from "react-native";
import type { AxisBounds, DragBounds, ResizeEdge } from "../../core";
import {
  useDragState,
  useGestureAdapter,
} from "../../context/GestureAdapterContext";
import { useViewConfig } from "../../context/LayoutContext";

/** Moving the whole event (built by its column or week row). */
export interface MoveSpec {
  snapX: number;
  snapY: number;
  bounds: DragBounds;
  /** Released at snapped offsets in px. */
  drop: (dx: number, dy: number) => void;
  /** Moves by days and minutes (screen-reader actions). */
  shift: (days: number, minutes: number) => void;
  /** Minutes per step, or 0 where only whole days move (month). */
  stepMinutes: number;
}

/** Resizing from an edge (time grids). */
export interface ResizeSpec {
  snapY: number;
  top?: AxisBounds;
  bottom?: AxisBounds;
  /** Released with an edge's snapped offset in px. */
  drop: (edge: ResizeEdge, dy: number) => void;
  /** Moves an edge by minutes (screen-reader actions). */
  stretch: (edge: ResizeEdge, minutes: number) => void;
  stepMinutes: number;
}

export interface DragSpec {
  move?: MoveSpec;
  resize?: ResizeSpec;
}

export interface Draggable {
  /** The event is drawn inside the gestures wrapper and should fill it. */
  wrapped: boolean;
  /** Wraps the event's element; returns it as is when not wrapped. */
  wrap: (frame: StyleProp<ViewStyle>, node: ReactNode) => ReactNode;
  accessibilityActions?: AccessibilityActionInfo[];
  onAccessibilityAction?: (e: AccessibilityActionEvent) => void;
}

const NONE: Draggable = { wrapped: false, wrap: (_, node) => node };

export function useDraggable(spec: DragSpec | undefined): Draggable {
  const { EventWrapper } = useGestureAdapter();
  const { setDragging } = useDragState();
  const { messages } = useViewConfig();
  const { move, resize } = spec ?? {};
  if (!move && !resize) return NONE;

  const actions: AccessibilityActionInfo[] = [];
  if (move) {
    if (move.stepMinutes > 0)
      actions.push(
        { name: "moveEarlier", label: messages.moveEarlier(move.stepMinutes) },
        { name: "moveLater", label: messages.moveLater(move.stepMinutes) },
      );
    actions.push(
      { name: "movePreviousDay", label: messages.movePreviousDay },
      { name: "moveNextDay", label: messages.moveNextDay },
    );
  }
  if (resize?.bottom)
    actions.push(
      { name: "makeLonger", label: messages.makeLonger(resize.stepMinutes) },
      { name: "makeShorter", label: messages.makeShorter(resize.stepMinutes) },
    );

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    switch (e.nativeEvent.actionName) {
      case "moveEarlier":
        return move?.shift(0, -move.stepMinutes);
      case "moveLater":
        return move?.shift(0, move.stepMinutes);
      case "movePreviousDay":
        return move?.shift(-1, 0);
      case "moveNextDay":
        return move?.shift(1, 0);
      case "makeLonger":
        return resize?.stretch("bottom", resize.stepMinutes);
      case "makeShorter":
        return resize?.stretch("bottom", -resize.stepMinutes);
    }
  };

  if (!EventWrapper)
    return {
      wrapped: false,
      wrap: NONE.wrap,
      accessibilityActions: actions,
      onAccessibilityAction,
    };

  return {
    wrapped: true,
    wrap: (frame, node) => (
      <EventWrapper
        style={frame}
        move={
          move && {
            snapX: move.snapX,
            snapY: move.snapY,
            bounds: move.bounds,
            onEnd: (dx, dy) => {
              setDragging(false);
              move.drop(dx, dy);
            },
          }
        }
        resize={
          resize && {
            snapY: resize.snapY,
            top: resize.top,
            bottom: resize.bottom,
            onEnd: (edge, dy) => {
              setDragging(false);
              resize.drop(edge, dy);
            },
          }
        }
        onDragStart={() => setDragging(true)}
        onDragCancel={() => setDragging(false)}
      >
        {node}
      </EventWrapper>
    ),
    accessibilityActions: actions,
    onAccessibilityAction,
  };
}
