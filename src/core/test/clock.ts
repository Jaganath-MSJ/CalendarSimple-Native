/**
 * @file Luxon clock and zone helpers for core tests.
 */
import { DateTime, Settings } from "luxon";

const originalNow = Settings.now;

/** Freezes Luxon's `now` at the given local ISO time. */
export function freezeNow(iso: string): void {
  const millis = DateTime.fromISO(iso).toMillis();
  Settings.now = () => millis;
}

/** Restores Luxon's real clock. */
export function restoreNow(): void {
  Settings.now = originalNow;
}

/** Runs `fn` with Luxon's default zone set to `zone`, then restores it. */
export function withZone<T>(zone: string, fn: () => T): T {
  const previous = Settings.defaultZone;
  Settings.defaultZone = zone;
  try {
    return fn();
  } finally {
    Settings.defaultZone = previous;
  }
}
