/**
 * @file Month cell overflow (port spec §4.2, web hidden rule).
 */
import type { CalendarDayInfo } from "../../core";
import { originalOf } from "../../hooks/useMonthGrid";
import type { CalendarEvent } from "../../types";

export interface CellOverflow<E> {
  /** Slots drawn in the cell. */
  visibleSlots: number;
  /** `totalEvents − non-null entries in the visible slots`. */
  hidden: number;
  /** Real (non-spacer) events past the visible ones, as the app's objects. */
  hiddenEvents: E[];
}

export function getCellOverflow<E extends CalendarEvent>(
  day: CalendarDayInfo<E>,
  maxSlots: number,
): CellOverflow<E> {
  const visible = day.events.slice(0, maxSlots);
  const shown = visible.filter((e) => e !== null).length;
  const real = day.events.filter((e) => e !== null);
  return {
    visibleSlots: visible.length,
    hidden: Math.max(0, day.totalEvents - shown),
    hiddenEvents: real
      .slice(shown)
      .filter((e) => !e.isSpacer)
      .map((e) => originalOf<E>(e)),
  };
}
