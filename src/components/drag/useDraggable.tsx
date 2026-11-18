/**
 * @file What a draggable or resizable event needs: the gestures wrapper
 * (when an adapter is provided) and the screen-reader actions (always).
 */
import { useRef, type ReactNode } from "react";
import {
  Platform,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { AxisBounds, DragBounds, ResizeEdge } from "../../core";
import {
  useDragState,
  useGestureAdapter,
} from "../../context/GestureAdapterContext";
import { useViewConfig } from "../../context/LayoutContext";
import type { HapticKind } from "../../types";

/** Shortest gap between two `"snap"` haptics, in ms. */
export const SNAP_HAPTIC_MS = 50;

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
  /**
   * The event's press handlers. On web the press still ends after a drag
   * (native gesture handlers cancel it); that one is not a click.
   */
  press: (onPress: () => void, onLongPress: () => void) => PressHandlers;
}

interface PressHandlers {
  onPressIn?: () => void;
  onPress: () => void;
  onLongPress: () => void;
}

const passThrough = (onPress: () => void, onLongPress: () => void) => ({
  onPress,
  onLongPress,
});

const NONE: Draggable = {
  wrapped: false,
  wrap: (_, node) => node,
  press: passThrough,
};

export function useDraggable(spec: DragSpec | undefined): Draggable {
  const { EventWrapper } = useGestureAdapter();
  const { setDragging } = useDragState();
  const { messages, onHaptic } = useViewConfig();
  const lastSnap = useRef(0);
  // A drag began during the current press.
  const dragged = useRef(false);
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
      press: passThrough,
    };

  // Haptics are a native-app concern; web never gets them.
  const haptic = (kind: HapticKind) => {
    if (onHaptic && Platform.OS !== "web") onHaptic(kind);
  };
  const onStep = () => {
    const now = Date.now();
    if (now - lastSnap.current < SNAP_HAPTIC_MS) return;
    lastSnap.current = now;
    haptic("snap");
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
              haptic("drop");
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
              haptic("resize");
              resize.drop(edge, dy);
            },
          }
        }
        onDragStart={() => {
          dragged.current = true;
          setDragging(true);
          haptic("lift");
        }}
        onDragCancel={() => {
          setDragging(false);
          haptic("cancel");
        }}
        onStep={onHaptic && Platform.OS !== "web" ? onStep : undefined}
      >
        {node}
      </EventWrapper>
    ),
    accessibilityActions: actions,
    onAccessibilityAction,
    press: (onPress, onLongPress) => ({
      onPressIn: () => {
        dragged.current = false;
      },
      onPress: () => {
        if (!dragged.current) onPress();
      },
      onLongPress: () => {
        if (!dragged.current) onLongPress();
      },
    }),
  };
}
