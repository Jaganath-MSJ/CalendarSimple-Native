/**
 * @file What a draggable event needs: the gestures wrapper (when an adapter
 * is provided) and the screen-reader move actions (always).
 */
import type { ReactNode } from "react";
import type {
  AccessibilityActionEvent,
  AccessibilityActionInfo,
  StyleProp,
  ViewStyle,
} from "react-native";
import type { DragBounds } from "../../core";
import {
  useDragState,
  useGestureAdapter,
} from "../../context/GestureAdapterContext";
import { useViewConfig } from "../../context/LayoutContext";

/** How one event may move (built by its column or week row). */
export interface DragSpec {
  snapX: number;
  snapY: number;
  bounds: DragBounds;
  /** Released at snapped offsets in px. */
  drop: (dx: number, dy: number) => void;
  /** Moves by days and minutes (screen-reader actions). */
  move: (days: number, minutes: number) => void;
  /** Minutes per step, or 0 where only whole days move (month). */
  stepMinutes: number;
}

export interface Draggable {
  /** The event is drawn inside the gestures wrapper (position it at 0, 0). */
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
  if (!spec) return NONE;

  const actions: AccessibilityActionInfo[] = [
    ...(spec.stepMinutes > 0
      ? [
          {
            name: "moveEarlier",
            label: messages.moveEarlier(spec.stepMinutes),
          },
          { name: "moveLater", label: messages.moveLater(spec.stepMinutes) },
        ]
      : []),
    { name: "movePreviousDay", label: messages.movePreviousDay },
    { name: "moveNextDay", label: messages.moveNextDay },
  ];
  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    switch (e.nativeEvent.actionName) {
      case "moveEarlier":
        return spec.move(0, -spec.stepMinutes);
      case "moveLater":
        return spec.move(0, spec.stepMinutes);
      case "movePreviousDay":
        return spec.move(-1, 0);
      case "moveNextDay":
        return spec.move(1, 0);
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
        snapX={spec.snapX}
        snapY={spec.snapY}
        bounds={spec.bounds}
        onDragStart={() => setDragging(true)}
        onDragEnd={(dx, dy) => {
          setDragging(false);
          spec.drop(dx, dy);
        }}
        onDragCancel={() => setDragging(false)}
      >
        {node}
      </EventWrapper>
    ),
    accessibilityActions: actions,
    onAccessibilityAction,
  };
}
