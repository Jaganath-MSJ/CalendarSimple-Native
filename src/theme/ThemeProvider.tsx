/**
 * @file Theme context: palette, metrics, scheme, breakpoint, flip, font scale (TDD §8.2).
 */
import { createContext, useContext, type ReactNode } from "react";
import { PALETTE, type CalendarPalette } from "./palette";
import { getMetrics, type Breakpoint, type CalendarMetrics } from "./metrics";

export interface CalendarThemeValue {
  palette: CalendarPalette;
  metrics: CalendarMetrics;
  scheme: "light" | "dark";
  breakpoint: Breakpoint;
  flip: boolean;
  fontScale: number;
}

const DEFAULT_THEME: CalendarThemeValue = {
  palette: PALETTE.light,
  metrics: getMetrics("phone"),
  scheme: "light",
  breakpoint: "phone",
  flip: false,
  fontScale: 1,
};

const ThemeContext = createContext<CalendarThemeValue>(DEFAULT_THEME);

export function CalendarThemeProvider({
  value,
  children,
}: {
  value: CalendarThemeValue;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Current calendar theme; light phone defaults outside a provider. */
export function useCalendarTheme(): CalendarThemeValue {
  return useContext(ThemeContext);
}
