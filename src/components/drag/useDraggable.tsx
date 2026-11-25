/**
 * @file What a draggable or resizable event needs: the gestures wrapper
 * (when an adapter is provided), the screen-reader actions (always) and the
 * Alt+arrow keys (web).
 */
import {
  useRef,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Platform,
  type Pressable,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  getEventKeyAction,
  getEventKeyShortcuts,
  type AxisBounds,
  type DragBounds,
  type EventKeyOptions,
  type ResizeEdge,
} from "../../core";
import {
  useDragState,
  useGestureAdapter,
} from "../../context/GestureAdapterContext";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import {
  readKey,
  useKeyboardEnabled,
  type WebKeyEvent,
} from "../../hooks/useKeyboardNavigation";
import type { HapticKind } from "../../types";
import {
  focusKey as keyOf,
  markFocusAfterMove,
  useFocusAfterMove,
  type EventFocus,
} from "./focusAfterMove";

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
  /** Days per row for Alt+↑/↓ when `stepMinutes` is 0 (Month: 7). */
  rowDays?: number;
  /** Day columns run right to left on screen (Alt+←/→ mirror). */
  reversed?: boolean;
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
  /**
   * Keeps keyboard focus on the event after a keyboard move. Set it on one
   * drawn piece of the event only (the one holding its start, or the first
   * visible one), so a multi-week or multi-day event takes focus once.
   */
  focus?: EventFocus;
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
  /** Web keys (Alt+arrows) and focus after a keyboard move. */
  keys?: EventKeyProps;
}

/** Props for the event's pressable on web. */
export interface EventKeyProps {
  ref: RefObject<ComponentRef<typeof Pressable> | null>;
  onKeyDown: (e: WebKeyEvent) => void;
  "aria-keyshortcuts"?: string;
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
  const { messages, onHaptic, keyboardNavigation } = useViewConfig();
  // The event keys follow keyboardNavigation (and only the current page).
  const keyboard = useKeyboardEnabled(keyboardNavigation);
  const lastSnap = useRef(0);
  // A drag began during the current press.
  const dragged = useRef(false);
  const id = useTestID();
  const keyRef = useRef<ComponentRef<typeof Pressable> | null>(null);
  const focus = spec?.focus;
  // Its key now, and after a keyboard move (`undefined` on neighbour pages).
  const prefix = focus ? id("focus") : undefined;
  const focusKey = prefix && focus ? `${prefix}|${keyOf(focus)}` : undefined;
  useFocusAfterMove(focusKey, keyRef);
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

  // Web: Alt+arrows move, Alt+Shift+↑/↓ resize the end (calendar-simple).
  const keyOptions: EventKeyOptions = {
    move: move && {
      stepMinutes: move.stepMinutes,
      rowDays: move.rowDays,
      reversed: move.reversed,
    },
    resizeMinutes: resize?.bottom ? resize.stepMinutes : undefined,
  };
  const keys: EventKeyProps | undefined = keyboard
    ? {
        ref: keyRef,
        "aria-keyshortcuts": getEventKeyShortcuts(keyOptions),
        onKeyDown: (e) => {
          const key = readKey(e);
          const action = key && getEventKeyAction(key, keyOptions);
          if (!action) return;
          e.preventDefault();
          markFocusAfterMove(
            prefix && focus
              ? `${prefix}|${
                  action.type === "move"
                    ? keyOf(focus, action.days, action.minutes)
                    : keyOf(focus)
                }`
              : undefined,
          );
          if (action.type === "move") move?.shift(action.days, action.minutes);
          else resize?.stretch("bottom", action.minutes);
        },
      }
    : undefined;

  if (!EventWrapper)
    return {
      wrapped: false,
      wrap: NONE.wrap,
      accessibilityActions: actions,
      onAccessibilityAction,
      press: passThrough,
      keys,
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
    keys,
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
