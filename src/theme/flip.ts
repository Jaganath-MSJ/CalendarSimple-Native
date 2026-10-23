/**
 * @file Whether rows must be mirrored by hand (TDD §8.1 step 4).
 */
import type { Direction } from "../core";

/**
 * React Native already mirrors rows when the app is RTL, so the calendar
 * flips only when its direction differs from the app's.
 */
export function resolveFlip(direction: Direction, appIsRTL: boolean): boolean {
  return (direction === "rtl") !== appIsRTL;
}
