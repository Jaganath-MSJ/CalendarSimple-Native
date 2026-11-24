/**
 * @file Keeps keyboard focus on an event moved with Alt+arrows (web). When
 * the app updates `events`, the event may be redrawn in another column or
 * cell (a new element); that element takes focus if it mounts soon after
 * the move (calendar-simple's `useFocusAfterMove`).
 */
import { useEffect, type RefObject } from "react";

const FOCUS_WINDOW_MS = 1000;
let pending: { key: string; until: number } | null = null;

/** Marks the event (calendar test ID + event id) to take focus when redrawn. */
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
