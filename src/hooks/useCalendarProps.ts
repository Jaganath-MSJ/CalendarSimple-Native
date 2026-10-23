/**
 * @file Merges the context config with view-local props (web merge rule).
 */
import { useCalendarConfig } from "../context/CalendarContext";
import type { CalendarProps, ResolvedConfig } from "../types";

/**
 * Local props win when defined; `undefined` keeps the context value.
 * Reads only the config context, so navigation does not re-render callers.
 */
export function useCalendarProps<T extends Partial<CalendarProps>>(
  local: T,
): ResolvedConfig {
  const { config } = useCalendarConfig();
  const merged: Record<string, unknown> = { ...config };
  for (const key in local) {
    if (local[key] !== undefined) merged[key] = local[key];
  }
  return merged as ResolvedConfig; // Same keys as config, overridden by defined locals.
}
