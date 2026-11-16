/**
 * @file Drag-to-move maths (pure): offsets in pixels to columns, steps and
 * the new times. The gestures entry only reports snapped offsets.
 */
import type { DateTime } from "luxon";

/** Allowed offset on one axis, in px (`min` ≤ 0 ≤ `max`). */
export interface AxisBounds {
  min: number;
  max: number;
}

/** Offsets a lifted event may reach, in px. */
export interface DragBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Bounds along a row of `count` cells of `size` px for the cell at logical
 * `index`. When the row is drawn `reversed` (right to left on screen),
 * logical index 0 is the rightmost cell.
 */
export function getAxisBounds(
  index: number,
  count: number,
  size: number,
  reversed = false,
): AxisBounds {
  const visual = reversed ? count - 1 - index : index;
  return { min: -visual * size, max: (count - 1 - visual) * size };
}

/** Whole cells moved for an on-screen offset, in logical order. */
export function cellsMoved(
  offset: number,
  size: number,
  reversed = false,
): number {
  if (size <= 0) return 0;
  const cells = Math.round(offset / size);
  return (reversed ? -cells : cells) || 0;
}

/** Whole steps moved for an offset (minutes = steps × step minutes). */
export function stepsMoved(offset: number, stepPx: number): number {
  return stepPx > 0 ? Math.round(offset / stepPx) || 0 : 0;
}

/**
 * The event's new start and end after moving `days` and `minutes`. The
 * length is kept; an event without `end` ends at its new start.
 */
export function moveEvent(
  start: DateTime,
  end: DateTime | undefined,
  days: number,
  minutes: number,
): { start: DateTime; end: DateTime } {
  const nextStart = start.plus({ days, minutes });
  const nextEnd = end ? end.plus({ days, minutes }) : nextStart;
  return { start: nextStart, end: nextEnd };
}
