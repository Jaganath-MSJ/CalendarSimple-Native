/**
 * @file Keeps keyboard focus on an event moved with Alt+arrows (web). When
 * the app updates `events`, the event may be redrawn in another column or
 * cell (a new element); that element takes focus if it mounts soon after
 * the move (calendar-simple's `useFocusAfterMove`).
 */
import { useEffect, type RefObject } from "react";
import { dateFn, type BaseCalendarEvent } from "../../core";

const FOCUS_WINDOW_MS = 1000;
let pending: { key: string; until: number } | null = null;

/**
 * What identifies an event across a move: its series (a moved occurrence
 * gets a new id) or its own id, and its start. `focusKey(focus, days,
 * minutes)` is the same event's key after a move by that much.
 */
export interface EventFocus {
  key: string;
  start: BaseCalendarEvent["startDate"];
}

/** The focus identity of an event (see `EventFocus`). */
export function eventFocus(event: BaseCalendarEvent): EventFocus {
  return {
    key: event.recurringEventId ?? event.id ?? String(event.startDate),
    start: event.startDate,
  };
}

/** `"<key>|<start ms>"`, optionally after moving the start. */
export function focusKey(focus: EventFocus, days = 0, minutes = 0): string {
  const start = dateFn(focus.start).plus({ days, minutes });
  return `${focus.key}|${start.toMillis()}`;
}

/** Marks the event (calendar test ID + focus key) to take focus when redrawn. */
export function markFocusAfterMove(key: string | undefined): void {
  pending = key ? { key, until: Date.now() + FOCUS_WINDOW_MS } : null;
}

/** Focuses `ref` on mount when it is the event just moved by keyboard. */
export function useFocusAfterMove(
  key: string | undefined,
  ref: RefObject<{ focus?: () => void } | null>,
): void {
  useEffect(() => {
    if (!key || !pending || pending.key !== key) return;
    if (Date.now() < pending.until && ref.current) {
      pending = null;
      ref.current.focus?.();
    }
  }, [key, ref]);
}
