/**
 * @file Pinch to zoom the time grid: during the pinch the content scales
 * vertically around the fingers (a transform on the UI thread); on release
 * the new hour height is reported once and the main package lays the grid
 * out at that height.
 */
/* eslint-disable react-hooks/immutability -- Reanimated shared values are
   mutated through `.value` by design (works on Reanimated 3.16+ and 4). */
import { useEffect, useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import type { ZoomWrapperProps } from "../context/GestureAdapterContext";

/** If the app has not changed `hourHeight` by then, the scale eases back. */
const SETTLE_MS = 400;

/**
 * The hour height for a pinch `scale` from `base`, kept inside
 * `[min, max]` and rounded to whole points.
 */
export function zoomedHourHeight(
  base: number,
  scale: number,
  min: number,
  max: number,
): number {
  "worklet";
  return Math.round(Math.min(max, Math.max(min, base * scale)));
}

export function PinchZoom({
  children,
  hourHeight,
  minHourHeight,
  maxHourHeight,
  onZoomStart,
  onZoomEnd,
}: ZoomWrapperProps) {
  const scale = useSharedValue(1);
  const focal = useSharedValue(0);
  const height = useSharedValue(0);
  const active = useSharedValue(false);

  // A new height means the grid was laid out again: drop the transform.
  useEffect(() => {
    scale.value = 1;
  }, [hourHeight, scale]);

  const gesture = useMemo(() => {
    /**
     * Activates once two fingers are down and notes their midpoint. A pinch
     * that waits for its own threshold loses the touch to the scroll views
     * (vertical grid, day pager), which cancels it.
     */
    const grab = (
      e: { numberOfTouches: number; allTouches: { y: number }[] },
      manager: { activate: () => void },
    ) => {
      "worklet";
      if (e.numberOfTouches < 2 || active.value) return;
      let y = 0;
      for (const t of e.allTouches) y += t.y;
      focal.value = y / e.allTouches.length;
      manager.activate();
    };
    return (
      Gesture.Pinch()
        .manualActivation(true)
        .onTouchesDown(grab)
        // Android begins a pinch only after the second finger's down event,
        // so activation may succeed only on the first move.
        .onTouchesMove(grab)
        .onTouchesUp((e, manager) => {
          if (active.value && e.numberOfTouches - e.changedTouches.length < 2)
            manager.end();
        })
        .onStart(() => {
          active.value = true;
          runOnJS(onZoomStart)();
        })
        .onUpdate((e) => {
          const next = zoomedHourHeight(
            hourHeight,
            e.scale,
            minHourHeight,
            maxHourHeight,
          );
          scale.value = next / hourHeight;
        })
        .onEnd(() => {
          active.value = false;
          const next = zoomedHourHeight(
            hourHeight,
            scale.value,
            minHourHeight,
            maxHourHeight,
          );
          runOnJS(onZoomEnd)(next, focal.value);
          scale.value = withDelay(SETTLE_MS, withTiming(1));
        })
        .onFinalize(() => {
          if (!active.value) return;
          // Cancelled by the system while active.
          active.value = false;
          scale.value = withTiming(1);
          runOnJS(onZoomEnd)(hourHeight, focal.value);
        })
    );
  }, [
    hourHeight,
    minHourHeight,
    maxHourHeight,
    onZoomStart,
    onZoomEnd,
    scale,
    focal,
    active,
  ]);

  // Scale around the focal point: the default origin is the centre.
  const animated = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: (focal.value - height.value / 2) * (1 - scale.value),
        },
        { scaleY: scale.value },
      ],
    }),
    [],
  );
  const onLayout = (e: LayoutChangeEvent) => {
    height.value = e.nativeEvent.layout.height;
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View onLayout={onLayout} style={animated}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
