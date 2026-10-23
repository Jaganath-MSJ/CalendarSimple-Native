/**
 * @file Per-event colours (#18: colour keys only).
 */
import { getContrastColor } from "../core";
import type { CalendarEventStyle } from "../types";

export interface PickedEventStyle {
  backgroundColor: string;
  color: string;
  borderColor?: string;
  opacity?: number;
}

/**
 * Keeps only `backgroundColor`, `color`, `borderColor` and `opacity` from an
 * event's `style`, so layout keys cannot break the grid. The background falls
 * back to `fallbackBg`; the text to the contrast colour of the background.
 */
export function pickEventStyle(
  style: CalendarEventStyle | undefined,
  fallbackBg: string,
): PickedEventStyle {
  const backgroundColor = style?.backgroundColor ?? fallbackBg;
  const out: PickedEventStyle = {
    backgroundColor,
    color: style?.color ?? getContrastColor(backgroundColor),
  };
  if (style?.borderColor !== undefined) out.borderColor = style.borderColor;
  if (style?.opacity !== undefined) out.opacity = style.opacity;
  return out;
}
