/**
 * @file Skeleton shimmer: an opacity pulse (port spec §4.7, TDD §12).
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import { useReduceMotion } from "../../hooks/useReduceMotion";

const HALF_CYCLE_MS = 750;

/**
 * Opacity 1 → 0.5 → 1 over 1.5 s, looped on the native driver. Stays at 1
 * under Reduce Motion. The loop starts only once the OS setting has been
 * read, so a Reduce Motion user never sees a first pulse. `enabled: false`
 * (neighbour pager pages) never pulses.
 */
export function usePulse(enabled = true): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion || !enabled) {
      opacity.setValue(1);
      return;
    }
    let anim: Animated.CompositeAnimation | undefined;
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((on) => {
        if (!live || on) return;
        const step = (toValue: number) =>
          Animated.timing(opacity, {
            toValue,
            duration: HALF_CYCLE_MS,
            // CSS ease-in-out.
            easing: Easing.bezier(0.42, 0, 0.58, 1),
            useNativeDriver: true,
          });
        anim = Animated.loop(Animated.sequence([step(0.5), step(1)]));
        anim.start();
      });
    return () => {
      live = false;
      anim?.stop();
      opacity.setValue(1);
    };
  }, [reduceMotion, enabled, opacity]);

  return opacity;
}
