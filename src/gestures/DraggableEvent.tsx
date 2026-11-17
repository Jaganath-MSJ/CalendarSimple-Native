/**
 * @file A draggable / resizable event: a long press near the top or bottom
 * edge resizes that edge, anywhere else it lifts and moves the event. Steps
 * snap inside the bounds on the UI thread; the release reports the offsets
 * and the main package turns them into times (`onEventDrop`,
 * `onEventResize`).
 */
/* eslint-disable react-hooks/immutability -- Reanimated shared values are
   mutated through `.value` by design (works on Reanimated 3.16+ and 4). */
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { DragWrapperProps } from "../context/GestureAdapterContext";

/** Hold time before a drag starts; shorter presses stay taps and scrolls. */
export const LONG_PRESS_MS = 250;

/** Edge zone inside the event that resizes, in pt (a quarter of short events). */
export const EDGE_ZONE = 16;

/** How far the touch area reaches past a resizable edge, in pt. */
export const EDGE_SLOP = 12;

/** If the app has not changed the event by then, it springs back. */
const SETTLE_MS = 400;

const NONE = 0;
const MOVE = 1;
const TOP = 2;
const BOTTOM = 3;

/** `value` clamped to `[min, max]`, then snapped to whole `step`s inside it. */
export function snapOffset(
  value: number,
  step: number,
  min: number,
  max: number,
): number {
  "worklet";
  if (step <= 0) return 0;
  const lo = Math.ceil(min / step) * step;
  const hi = Math.floor(max / step) * step;
  const snapped = Math.round(value / step) * step;
  return Math.min(hi, Math.max(lo, snapped)) || 0;
}

/**
 * What a long press at `y` (pt from the event's top) does: resize the top or
 * bottom edge when allowed and inside its zone, else move when allowed.
 * Returns 0 (nothing), 1 (move), 2 (top) or 3 (bottom).
 */
export function pickMode(
  y: number,
  height: number,
  canMove: boolean,
  canTop: boolean,
  canBottom: boolean,
): number {
  "worklet";
  const zone = Math.min(EDGE_ZONE, height / 4);
  if (canTop && y < zone) return TOP;
  if (canBottom && y > height - zone) return BOTTOM;
  return canMove ? MOVE : NONE;
}

export function DraggableEvent({
  children,
  style,
  move,
  resize,
  onDragStart,
  onDragCancel,
  onStep,
}: DragWrapperProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const dTop = useSharedValue(0);
  const dBottom = useSharedValue(0);
  const lifted = useSharedValue(0);
  const grips = useSharedValue(0);
  const mode = useSharedValue(NONE);

  const flat = StyleSheet.flatten(style) ?? {};
  const baseZ = typeof flat.zIndex === "number" ? flat.zIndex : 0;
  const baseH = typeof flat.height === "number" ? flat.height : 0;
  // A new frame means the app changed the event: drop the offsets at once.
  const frameKey = `${String(flat.left)}|${String(flat.right)}|${String(flat.top)}|${baseH}`;
  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
    dTop.value = 0;
    dBottom.value = 0;
  }, [frameKey, tx, ty, dTop, dBottom]);

  // Plain values for the worklets.
  const canMove = Boolean(move);
  const mSnapX = move?.snapX ?? 0;
  const mSnapY = move?.snapY ?? 0;
  const minX = move?.bounds.minX ?? 0;
  const maxX = move?.bounds.maxX ?? 0;
  const minY = move?.bounds.minY ?? 0;
  const maxY = move?.bounds.maxY ?? 0;
  const onMoveEnd = move?.onEnd;
  const canTop = Boolean(resize?.top);
  const canBottom = Boolean(resize?.bottom);
  const rSnap = resize?.snapY ?? 0;
  const topMin = resize?.top?.min ?? 0;
  const topMax = resize?.top?.max ?? 0;
  const botMin = resize?.bottom?.min ?? 0;
  const botMax = resize?.bottom?.max ?? 0;
  const onResizeEnd = resize?.onEnd;
  const resizing = canTop || canBottom;

  const gesture = useMemo(() => {
    const finishMove = (dx: number, dy: number) => onMoveEnd?.(dx, dy);
    const finishResize = (top: boolean, d: number) =>
      onResizeEnd?.(top ? "top" : "bottom", d);
    return Gesture.Pan()
      .activateAfterLongPress(LONG_PRESS_MS)
      .hitSlop({
        top: canTop ? EDGE_SLOP : 0,
        bottom: canBottom ? EDGE_SLOP : 0,
      })
      .onBegin(() => {
        if (resizing) grips.value = withTiming(1, { duration: 120 });
      })
      .onStart((e) => {
        mode.value = pickMode(e.y, baseH, canMove, canTop, canBottom);
        if (mode.value === NONE) return;
        lifted.value = withTiming(1, { duration: 120 });
        runOnJS(onDragStart)();
      })
      .onUpdate((e) => {
        let stepped = false;
        if (mode.value === MOVE) {
          const x = snapOffset(e.translationX, mSnapX, minX, maxX);
          const y = snapOffset(e.translationY, mSnapY, minY, maxY);
          stepped = x !== tx.value || y !== ty.value;
          tx.value = x;
          ty.value = y;
        } else if (mode.value === TOP) {
          const d = snapOffset(e.translationY, rSnap, topMin, topMax);
          stepped = d !== dTop.value;
          dTop.value = d;
        } else if (mode.value === BOTTOM) {
          const d = snapOffset(e.translationY, rSnap, botMin, botMax);
          stepped = d !== dBottom.value;
          dBottom.value = d;
        }
        if (stepped && onStep) runOnJS(onStep)();
      })
      .onEnd(() => {
        const m = mode.value;
        mode.value = NONE;
        if (m === NONE) return;
        lifted.value = withTiming(0, { duration: 120 });
        if (m === MOVE) {
          const dx = tx.value;
          const dy = ty.value;
          if (dx === 0 && dy === 0) {
            runOnJS(onDragCancel)();
            return;
          }
          runOnJS(finishMove)(dx, dy);
          tx.value = withDelay(SETTLE_MS, withSpring(0));
          ty.value = withDelay(SETTLE_MS, withSpring(0));
          return;
        }
        const top = m === TOP;
        const d = top ? dTop.value : dBottom.value;
        if (d === 0) {
          runOnJS(onDragCancel)();
          return;
        }
        runOnJS(finishResize)(top, d);
        if (top) dTop.value = withDelay(SETTLE_MS, withSpring(0));
        else dBottom.value = withDelay(SETTLE_MS, withSpring(0));
      })
      .onFinalize(() => {
        grips.value = withTiming(0, { duration: 120 });
        if (mode.value === NONE) return;
        // Cancelled by the system while active.
        mode.value = NONE;
        lifted.value = withTiming(0, { duration: 120 });
        tx.value = withSpring(0);
        ty.value = withSpring(0);
        dTop.value = withSpring(0);
        dBottom.value = withSpring(0);
        runOnJS(onDragCancel)();
      });
  }, [
    canMove,
    canTop,
    canBottom,
    resizing,
    baseH,
    mSnapX,
    mSnapY,
    minX,
    maxX,
    minY,
    maxY,
    rSnap,
    topMin,
    topMax,
    botMin,
    botMax,
    onDragStart,
    onDragCancel,
    onMoveEnd,
    onResizeEnd,
    onStep,
    tx,
    ty,
    dTop,
    dBottom,
    lifted,
    grips,
    mode,
  ]);

  const animated = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: tx.value },
        { translateY: ty.value + dTop.value },
        { scale: 1 + (mode.value === MOVE ? lifted.value * 0.04 : 0) },
      ],
      ...(resizing
        ? { height: Math.max(0, baseH - dTop.value + dBottom.value) }
        : {}),
      opacity: 1 - lifted.value * 0.15,
      zIndex: lifted.value > 0 ? 1000 : baseZ,
      shadowOpacity: lifted.value * 0.25,
      elevation: lifted.value * 8,
    }),
    // Explicit dependencies: works with or without the worklets Babel plugin.
    [baseZ, baseH, resizing],
  );
  const gripStyle = useAnimatedStyle(() => ({ opacity: grips.value }), []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, styles.shadow, animated]}>
        {children}
        {canTop ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.grip, styles.gripTop, gripStyle]}
          >
            <View style={styles.gripBar} />
          </Animated.View>
        ) : null}
        {canBottom ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.grip, styles.gripBottom, gripStyle]}
          >
            <View style={styles.gripBar} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  grip: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  gripTop: { top: 2 },
  gripBottom: { bottom: 2 },
  gripBar: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.35)",
  },
});
