/**
 * @file Hour slot under a press in a day column (TDD §8.7).
 */

/**
 * The hour at `y` px from the top of a column that starts at `minHour`.
 * The caller clamps the result to `[minHour, maxHour − 1]`.
 */
export function slotFromY(
  y: number,
  minHour: number,
  hourHeight: number,
): number {
  return minHour + Math.floor(Math.max(0, y) / hourHeight);
}
