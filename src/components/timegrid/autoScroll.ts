/**
 * @file Auto-scroll target for the time grid (#5).
 */

export interface AutoScrollInput {
  /** Wall-clock minutes since midnight. */
  nowMinutes: number;
  minHour: number;
  hourHeight: number;
  viewportHeight: number;
}

/**
 * `max(0, (nowMinutes − minHour·60) · hourHeight/60 − viewportHeight/2)`:
 * the current time centred in the viewport (#5 subtracts `minHour`).
 */
export function getAutoScrollY({
  nowMinutes,
  minHour,
  hourHeight,
  viewportHeight,
}: AutoScrollInput): number {
  return Math.max(
    0,
    ((nowMinutes - minHour * 60) * hourHeight) / 60 - viewportHeight / 2,
  );
}
