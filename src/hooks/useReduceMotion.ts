/**
 * @file The OS Reduce Motion setting.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** `true` when Reduce Motion is on; follows `reduceMotionChanged`. */
export function useReduceMotion(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (live) setEnabled(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setEnabled,
    );
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return enabled;
}
