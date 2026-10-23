/**
 * @file Header dropdown button for the view, month and year pickers.
 */
import { useRef, type ComponentRef } from "react";
import { StyleSheet, View } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useCalendarTheme } from "../../theme";
import type { MenuAnchor } from "../ui/AnchoredMenu";
import type { FocusAnchor } from "../ui/focusReturn";
import { CalendarText } from "../ui/CalendarText";
import { CalendarPressable } from "../ui/CalendarPressable";

export interface PickerButtonProps {
  kind: "view" | "month" | "year";
  label: string;
  /**
   * With `measure`, called with the button's window frame once
   * `measureInWindow` reports it, so an anchored menu never opens at a stale
   * anchor; otherwise called at once without a frame.
   */
  onPress: (frame: MenuAnchor | undefined, opener: FocusAnchor) => void;
  /** Measure before opening (wide anchored menus). */
  measure: boolean;
  expanded: boolean;
  testID: string;
}

export function PickerButton({
  kind,
  label,
  onPress,
  expanded,
  testID,
  measure,
}: PickerButtonProps) {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const { palette, metrics, flip } = useCalendarTheme();
  const { config } = useCalendarConfig();
  const { messages } = config;
  const hint =
    kind === "view"
      ? messages.selectView
      : kind === "month"
        ? messages.selectMonth
        : messages.selectYear;
  const height = metrics.header.controlHeight;
  const slop = Math.max(0, Math.ceil((metrics.touchTarget - height) / 2));
  return (
    <CalendarPressable
      ref={ref}
      testID={testID}
      onPress={() => {
        const opener = ref.current;
        if (!measure) {
          onPress(undefined, opener);
          return;
        }
        ref.current?.measureInWindow((x, y, width, height) =>
          onPress({ x, y, width, height }, opener),
        );
      }}
      hitSlop={{ top: slop, bottom: slop }}
      accessibilityRole="button"
      accessibilityLabel={`${hint}, ${label}`}
      accessibilityState={{ expanded }}
      style={({ pressed }) => [
        styles.button,
        flip && styles.reverse,
        {
          height,
          borderColor: palette.border,
          backgroundColor: pressed ? palette.bgMuted : palette.bg,
        },
      ]}
    >
      <CalendarText
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: palette.textPrimary,
            fontSize: metrics.header.controlFontSize,
          },
        ]}
      >
        {label}
      </CalendarText>
      <CalendarText style={[styles.caret, { color: palette.textSecondary }]}>
        ▾
      </CalendarText>
    </CalendarPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 4,
    flexShrink: 1,
  },
  label: { flexShrink: 1 },
  reverse: { flexDirection: "row-reverse" },
  caret: { fontSize: 12 },
});
