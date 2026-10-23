/**
 * @file Header dropdown button for the view, month and year pickers.
 */
import { useRef, type ComponentRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useCalendarTheme } from "../../theme";
import type { MenuAnchor } from "../ui/AnchoredMenu";

export interface PickerButtonProps {
  kind: "view" | "month" | "year";
  label: string;
  /**
   * With `measure`, called with the button's window frame once
   * `measureInWindow` reports it, so an anchored menu never opens at a stale
   * anchor; otherwise called at once without a frame.
   */
  onPress: (frame?: MenuAnchor) => void;
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
  const { palette, metrics } = useCalendarTheme();
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
    <Pressable
      ref={ref}
      testID={testID}
      onPress={() => {
        if (!measure) {
          onPress();
          return;
        }
        ref.current?.measureInWindow((x, y, width, height) =>
          onPress({ x, y, width, height }),
        );
      }}
      hitSlop={{ top: slop, bottom: slop }}
      accessibilityRole="button"
      accessibilityLabel={`${hint}, ${label}`}
      accessibilityState={{ expanded }}
      style={({ pressed }) => [
        styles.button,
        {
          height,
          borderColor: palette.border,
          backgroundColor: pressed ? palette.bgMuted : palette.bg,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={config.maxFontSizeMultiplier}
        style={[
          styles.label,
          {
            color: palette.textPrimary,
            fontSize: metrics.header.controlFontSize,
          },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.caret, { color: palette.textSecondary }]}>▾</Text>
    </Pressable>
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
  caret: { fontSize: 12 },
});
