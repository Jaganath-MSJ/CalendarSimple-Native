/**
 * @file How the example app opens: on web `?screen=<key>&scheme=light|dark`
 * (Playwright baselines, P9.S5); on native `EXPO_PUBLIC_INITIAL_SCREEN`
 * (inlined at bundle time, used for the perf run).
 */
import { createContext, useContext } from "react";
import { Platform } from "react-native";
import type { ColorScheme } from "../../src/core";

/** URL aliases for screen keys. */
const ALIASES: Record<string, string> = { "3days": "customDays" };

function webParams(): URLSearchParams | null {
  const location = (globalThis as { location?: { search: string } }).location;
  if (Platform.OS !== "web" || !location) return null;
  return new URLSearchParams(location.search);
}

export function initialScreen(): string | null {
  const key =
    webParams()?.get("screen") ??
    process.env.EXPO_PUBLIC_INITIAL_SCREEN ??
    null;
  return key ? (ALIASES[key] ?? key) : null;
}

export function forcedScheme(): ColorScheme {
  const scheme = webParams()?.get("scheme");
  return scheme === "light" || scheme === "dark" ? scheme : "auto";
}

export const SchemeContext = createContext<ColorScheme>("auto");

/** The `colorScheme` every example calendar passes. */
export function useExampleScheme(): ColorScheme {
  return useContext(SchemeContext);
}
