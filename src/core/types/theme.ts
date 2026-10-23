/**
 * @file Theme color override types for the calendar.
 */

/**
 * A color pair (text + background) used for theme state overrides.
 */
export interface ThemeStyle {
  /** Text / foreground color (any valid CSS color value). */
  color?: string;
  /** Background color (any valid CSS color value). */
  bgColor?: string;
}

/**
 * Per-state color overrides for a single color scheme.
 */
export interface ThemeScheme {
  /** Colors for standard, unselected, non-today date cells. */
  default?: ThemeStyle;
  /** Colors for the currently selected date. */
  selected?: ThemeStyle;
  /** Colors for today's date cell. */
  today?: ThemeStyle;
}

/**
 * Color overrides applied to key calendar states.
 * Flat keys apply to both schemes unless overridden.
 * `dark` / `light` sub-objects take precedence over flat keys
 * when the resolved color scheme matches.
 */
export interface CalendarTheme extends ThemeScheme {
  /** Overrides applied only when the resolved scheme is "dark". */
  dark?: ThemeScheme;
  /** Overrides applied only when the resolved scheme is "light". */
  light?: ThemeScheme;
}
