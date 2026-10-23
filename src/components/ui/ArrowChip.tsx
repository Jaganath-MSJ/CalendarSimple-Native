/**
 * @file Event chip with arrows on the sides where the event continues
 * (popover items; all-day banner later).
 */
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useCalendarTheme } from "../../theme";

const ARROW = 10;
const CLIPPED_PADDING = 14;
const PADDING = 6;

export interface ArrowChipProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  /** The event started before this day: arrow on the start side. */
  clippedStart: boolean;
  /** The event ends after this day: arrow on the end side. */
  clippedEnd: boolean;
  backgroundColor: string;
  height: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

function Arrow({
  side,
  color,
  height,
  testID,
}: {
  side: "left" | "right";
  color: string;
  height: number;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={[
        styles.arrow,
        {
          [side]: -ARROW,
          borderTopWidth: height / 2,
          borderBottomWidth: height / 2,
          [side === "left" ? "borderRightWidth" : "borderLeftWidth"]: ARROW,
          [side === "left" ? "borderRightColor" : "borderLeftColor"]: color,
        },
      ]}
    />
  );
}

/** Mirrored when the calendar flips. */
export function ArrowChip({
  clippedStart,
  clippedEnd,
  backgroundColor,
  height,
  style,
  children,
  testID,
  ...pressable
}: ArrowChipProps) {
  const { flip } = useCalendarTheme();
  const startSide = flip ? "right" : "left";
  const endSide = flip ? "left" : "right";
  const pad = (clipped: boolean) => (clipped ? CLIPPED_PADDING : PADDING);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      {...pressable}
      style={[
        styles.chip,
        {
          height,
          backgroundColor,
          [flip ? "marginRight" : "marginLeft"]: clippedStart ? ARROW : 0,
          [flip ? "marginLeft" : "marginRight"]: clippedEnd ? ARROW : 0,
          [flip ? "paddingRight" : "paddingLeft"]: pad(clippedStart),
          [flip ? "paddingLeft" : "paddingRight"]: pad(clippedEnd),
        },
        style,
      ]}
    >
      {clippedStart ? (
        <Arrow
          side={startSide}
          color={backgroundColor}
          height={height}
          testID={testID && `${testID}-arrow-start`}
        />
      ) : null}
      {children}
      {clippedEnd ? (
        <Arrow
          side={endSide}
          color={backgroundColor}
          height={height}
          testID={testID && `${testID}-arrow-end`}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { justifyContent: "center", borderRadius: 4 },
  arrow: {
    position: "absolute",
    top: 0,
    width: 0,
    height: 0,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
});
