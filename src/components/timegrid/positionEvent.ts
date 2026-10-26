/**
 * @file Maps a `layoutDayEvents` entry (minutes and percentages) to pixels.
 */
import type { BaseCalendarEvent, DayEventLayout } from "../../core";

export interface EventFrame {
  top: number;
  height: number;
  left: number;
  width: number;
  zIndex: number;
}

/** Gap between side-by-side events, as on web (`calc(width% − 2px)`). */
const EVENT_GAP = 2;

/**
 * `top`/`height` scale by `hourHeight / 60`; `left`/`width` are percentages
 * of `colWidth`, less a 2 px gap on the width.
 */
export function positionEvent<E extends BaseCalendarEvent>(
  l: DayEventLayout<E>,
  colWidth: number,
  hourHeight: number,
): EventFrame {
  const perMinute = hourHeight / 60;
  return {
    top: l.top * perMinute,
    height: l.height * perMinute,
    left: (l.left / 100) * colWidth,
    width: (l.width / 100) * colWidth - EVENT_GAP,
    zIndex: l.zIndex,
  };
}
