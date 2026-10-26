/**
 * @file Layout constants used by the core layout algorithms.
 */

/** Pixel dimensions used by layout algorithms to calculate cell sizes and event positioning. */
export const LAYOUT_CONSTANTS = {
  DATE_LABEL_HEIGHT: 28,
  CELL_PADDING: 8,
  EVENT_HEIGHT: 26,
  MIN_ROWS: 4,
  ALL_DAY_ROW_HEIGHT: 24,
  EVENT_ITEM_PADDING: 16,
  SMALL_EVENT_HEIGHT: 40,
  TINY_EVENT_HEIGHT: 20,
  DEFAULT_EVENT_COLOR: "#3b82f6",
} as const;

/** Month cell metrics used by `calculateMaxEvents` per breakpoint (#9). */
export const MONTH_METRICS = {
  web: { dateLabelHeight: 28, cellPadding: 8, eventPitch: 26 },
  phone: { dateLabelHeight: 24, cellPadding: 4, eventPitch: 8 },
} as const;
