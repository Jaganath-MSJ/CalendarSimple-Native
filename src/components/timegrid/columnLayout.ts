/**
 * @file Time-grid column modes (TDD §8.6).
 */
import type { Breakpoint } from "../../theme";

/** Width of the time column. */
export const TIME_GUTTER = 60;
/** Compact (≤ 768) column width with swipe off. */
const COMPACT_COLUMN = 100;
/** Phone column width is `width − 90` with swipe off (one day per screen). */
const PHONE_INSET = 90;

export interface ColumnLayoutInput {
  width: number;
  days: number;
  swipe: boolean;
  breakpoint: Breakpoint;
}

export interface ColumnLayout {
  colWidth: number;
  /** Day columns sit in a horizontal `ScrollView`. */
  scrollable: boolean;
  /** `snapToInterval = colWidth`. */
  snap: boolean;
}

/**
 * Columns fit the width when swipe is on or on wide screens. With swipe off,
 * compact columns are 100 wide and phone columns `width − 90` (snapping);
 * either scrolls only when the days do not fit.
 */
export function getColumnLayout({
  width,
  days,
  swipe,
  breakpoint,
}: ColumnLayoutInput): ColumnLayout {
  const available = Math.max(0, width - TIME_GUTTER);
  const fit = {
    colWidth: available / Math.max(1, days),
    scrollable: false,
    snap: false,
  };
  if (swipe || breakpoint === "wide") return fit;
  const colWidth =
    breakpoint === "phone" ? width - PHONE_INSET : COMPACT_COLUMN;
  if (colWidth * days <= available) return fit;
  return { colWidth, scrollable: true, snap: breakpoint === "phone" };
}
