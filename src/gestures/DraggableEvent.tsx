/**
 * @file A draggable event: a long press lifts it, the pan moves it in snapped
 * steps inside its bounds, and the release reports the offsets. The main
 * package turns them into times (`onEventDrop`).
 */
/* eslint-disable react-hooks/immutability -- Reanimated shared values are
   mutated through `.value` by design (works on Reanimated 3.16+ and 4). */
import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
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

/** If the app has not moved the event by then, it springs back. */
const SETTLE_MS = 400;

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

export function DraggableEvent({
  children,
  style,
  snapX,
  snapY,
  bounds,
  onDragStart,
  onDragEnd,
  onDragCancel,
}: DragWrapperProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lifted = useSharedValue(0);
  const started = useSharedValue(false);

  // A new frame means the app moved the event: drop the offset at once.
  const flat = StyleSheet.flatten(style) ?? {};
  const baseZ = typeof flat.zIndex === "number" ? flat.zIndex : 0;
  const frameKey = `${String(flat.left)}|${String(flat.right)}|${String(flat.top)}`;
  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
  }, [frameKey, tx, ty]);

  const { minX, maxX, minY, maxY } = bounds;
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart(() => {
          started.value = true;
          lifted.value = withTiming(1, { duration: 120 });
          runOnJS(onDragStart)();
        })
        .onUpdate((e) => {
          tx.value = snapOffset(e.translationX, snapX, minX, maxX);
          ty.value = snapOffset(e.translationY, snapY, minY, maxY);
        })
        .onEnd(() => {
          const dx = tx.value;
          const dy = ty.value;
          started.value = false;
          lifted.value = withTiming(0, { duration: 120 });
          if (dx === 0 && dy === 0) {
            runOnJS(onDragCancel)();
            return;
          }
          runOnJS(onDragEnd)(dx, dy);
          tx.value = withDelay(SETTLE_MS, withSpring(0));
          ty.value = withDelay(SETTLE_MS, withSpring(0));
        })
        .onFinalize((_e, success) => {
          if (success || !started.value) return;
          started.value = false;
          lifted.value = withTiming(0, { duration: 120 });
          tx.value = withSpring(0);
          ty.value = withSpring(0);
          runOnJS(onDragCancel)();
        }),
    [
      snapX,
      snapY,
      minX,
      maxX,
      minY,
      maxY,
      onDragStart,
      onDragEnd,
      onDragCancel,
      tx,
      ty,
      lifted,
      started,
    ],
  );

  const animated = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale: 1 + lifted.value * 0.04 },
      ],
      opacity: 1 - lifted.value * 0.15,
      zIndex: lifted.value > 0 ? 1000 : baseZ,
      shadowOpacity: lifted.value * 0.25,
      elevation: lifted.value * 8,
      // Explicit dependencies: works with or without the worklets Babel plugin.
    }),
    [baseZ],
  );

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, styles.shadow, animated]}>
        {children}
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
});
