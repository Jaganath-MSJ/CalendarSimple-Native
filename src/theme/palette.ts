/**
 * @file Palette tokens (TDD §10.1) and per-scheme overrides.
 */

/** Colour tokens used by every calendar component. */
export interface CalendarPalette {
  primary: string;
  primaryStrong: string;
  onPrimary: string;
  textPrimary: string;
  textSecondary: string;
  bg: string;
  bgMuted: string;
  border: string;
  surfaceRaised: string;
  focus: string;
  eventDefault: string;
  nowLine: string;
  scrim: string;
}

/** Token-by-token overrides per scheme (the `palette` prop). */
export interface CalendarPaletteOverrides {
  light?: Partial<CalendarPalette>;
  dark?: Partial<CalendarPalette>;
}

/** Built-in palette for both schemes (TDD §10.1). */
export const PALETTE: { light: CalendarPalette; dark: CalendarPalette } = {
  light: {
    primary: "#2563eb",
    primaryStrong: "#1d4ed8",
    onPrimary: "#ffffff",
    textPrimary: "#1f2937",
    textSecondary: "#4b5563",
    bg: "#ffffff",
    bgMuted: "#f3f4f6",
    border: "#e5e7eb",
    surfaceRaised: "#ffffff",
    focus: "#005fcc",
    eventDefault: "#2563eb",
    nowLine: "#ea4335",
    scrim: "rgba(17, 24, 39, 0.45)",
  },
  dark: {
    primary: "#60a5fa",
    primaryStrong: "#93c5fd",
    onPrimary: "#111827",
    textPrimary: "#f9fafb",
    textSecondary: "#9ca3af",
    bg: "#111827",
    bgMuted: "#1f2937",
    border: "#374151",
    surfaceRaised: "#1f2937",
    focus: "#93c5fd",
    eventDefault: "#2563eb",
    nowLine: "#ea4335",
    scrim: "rgba(0, 0, 0, 0.55)",
  },
};

/**
 * Returns the palette for `scheme` with that scheme's overrides applied.
 * Undefined override values keep the built-in token.
 */
export function resolvePalette(
  scheme: "light" | "dark",
  overrides?: CalendarPaletteOverrides,
): CalendarPalette {
  const base = PALETTE[scheme];
  const own = overrides?.[scheme];
  if (!own) return base;
  const out = { ...base };
  for (const key of Object.keys(own) as (keyof CalendarPalette)[]) {
    const value = own[key];
    if (value !== undefined) out[key] = value;
  }
  return out;
}
