/**
 * @file Merges the context config with view-local props (web merge rule).
 */
import { useMemo, useState } from "react";
import { useCalendarConfig } from "../context/CalendarContext";
import type { CalendarProps, ResolvedConfig } from "../types";

function shallowEqual(a: object, b: object): boolean {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      Object.is(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
  );
}

/**
 * `value` while it is shallowly equal to the previous one, so a fresh rest
 * object with the same props keeps its identity (TDD §13: stable `config`).
 */
function useShallowStable<T extends object>(value: T): T {
  const [kept, setKept] = useState(value);
  if (kept === value || shallowEqual(kept, value)) return kept;
  setKept(value); // Derived state: React re-renders at once with the new value.
  return value;
}

/**
 * Local props win when defined; `undefined` keeps the context value.
 * Reads only the config context, so navigation does not re-render callers.
 * The result keeps its identity until the config or a local prop changes,
 * so `ViewConfigProvider` consumers (cells, columns, rows) are not
 * re-rendered by unrelated view state such as the clock or an open sheet.
 */
export function useCalendarProps<T extends Partial<CalendarProps>>(
  local: T,
): ResolvedConfig {
  const { config } = useCalendarConfig();
  const stableLocal = useShallowStable(local);
  return useMemo(() => {
    const merged: Record<string, unknown> = { ...config };
    for (const key in stableLocal) {
      if (stableLocal[key] !== undefined) merged[key] = stableLocal[key];
    }
    return merged as ResolvedConfig; // Same keys as config, overridden by defined locals.
  }, [config, stableLocal]);
}
