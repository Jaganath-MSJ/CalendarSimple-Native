/**
 * @file Screen-reader focus return for sheets, popovers and menus (TDD §11):
 * when an overlay closes, focus goes back to the element that opened it.
 */
import { useEffect, useRef, type ComponentRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  type View,
} from "react-native";

/** The element that opened an overlay (a host instance, e.g. `e.currentTarget`). */
export type FocusAnchor = ComponentRef<typeof View> | null;

/**
 * Moves screen-reader focus to `anchor` where the platform supports
 * `setAccessibilityFocus` (iOS, Android; not web).
 */
export function returnFocus(anchor: FocusAnchor | undefined): void {
  if (Platform.OS === "web" || anchor == null) return;
  let tag: number | null | undefined;
  try {
    tag = findNodeHandle(anchor);
  } catch {
    return; // Not a mounted host component any more.
  }
  if (typeof tag === "number") AccessibilityInfo.setAccessibilityFocus(tag);
}

/**
 * Returns focus to `anchor` when `visible` turns false or the overlay
 * unmounts while open. The move waits one tick, so the closing `Modal` has
 * left the accessibility tree, and is cancelled when the effect re-runs
 * (StrictMode replays mount → unmount → mount).
 */
export function useReturnFocusOnClose(
  visible: boolean,
  anchor: FocusAnchor | undefined,
): void {
  const anchorRef = useRef(anchor);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);
  useEffect(() => {
    if (pending.current !== null) clearTimeout(pending.current);
    pending.current = null;
    if (!visible) return;
    return () => {
      pending.current = setTimeout(() => {
        pending.current = null;
        returnFocus(anchorRef.current);
      }, 0);
    };
  }, [visible]);
}
