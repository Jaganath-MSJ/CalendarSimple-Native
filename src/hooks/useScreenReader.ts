/**
 * @file The OS screen reader state.
 */
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** `true` when a screen reader is on; follows `screenReaderChanged`. */
export function useScreenReader(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((v) => {
        if (live) setEnabled(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setEnabled,
    );
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return enabled;
}
