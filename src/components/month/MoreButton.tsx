/**
 * @file "+ N more" under the visible chips (compact, wide).
 */
import { useRef, type ComponentRef } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { Frame } from "../ui/placePopover";
import { CalendarText } from "../ui/CalendarText";
import type { FocusAnchor } from "../ui/focusReturn";
import { CalendarPressable } from "../ui/CalendarPressable";

export interface MoreButtonProps {
  hidden: number;
  start: number;
  top: number;
  width: number;
  height: number;
  testID?: string;
  /**
   * Called at once; `measure` reports the button's window frame when
   * `measureInWindow` answers (the popover stays hidden until then).
   */
  onPress: (
    measure: (cb: (frame: Frame) => void) => void,
    anchor: FocusAnchor,
  ) => void;
}

export function MoreButton({
  hidden,
  start,
  top,
  width,
  height,
  testID,
  onPress,
}: MoreButtonProps) {
  const ref = useRef<ComponentRef<typeof Pressable>>(null);
  const cfg = useViewConfig();
  const { palette, metrics, flip } = useCalendarTheme();
  const label = cfg.messages.more(hidden);
  const slop = Math.max(0, Math.ceil((metrics.touchTarget - height) / 2));
  return (
    <CalendarPressable
      ref={ref}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: slop, bottom: slop }}
      onPress={() =>
        onPress(
          (cb) =>
            ref.current?.measureInWindow((x, y, w, h) =>
              cb({ x, y, width: w, height: h }),
            ),
          ref.current,
        )
      }
      style={({ pressed }) => [
        styles.button,
        flip ? { right: start } : { left: start },
        {
          top,
          width,
          height,
          backgroundColor: pressed ? palette.bgMuted : "transparent",
        },
      ]}
    >
      <CalendarText
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: palette.textSecondary,
            fontSize: metrics.month.moreFontSize,
          },
          cfg.styles.moreLabel,
        ]}
      >
        {label}
      </CalendarText>
    </CalendarPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    justifyContent: "center",
    borderRadius: 4,
    paddingHorizontal: 6,
  },
  text: { fontWeight: "600" },
});
