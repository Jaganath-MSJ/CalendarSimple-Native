/**
 * @file Event chip with arrows on the sides where the event continues
 * (popover items and the all-day banner).
 */
import type { ComponentRef, ReactNode, Ref } from "react";
import {
  StyleSheet,
  View,
  type Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useCalendarTheme } from "../../theme";
import { CalendarPressable } from "./CalendarPressable";

/** Width of the arrow point, in px. */
export const ARROW = 10;
/**
 * Padding on a clipped side, from the arrow's base: the arrow sits outside
 * the body, so the text starts `ARROW + 4` px from its point (14 px, as in
 * calendar-simple).
 */
export const CLIPPED_PADDING = 4;
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
  ref?: Ref<ComponentRef<typeof Pressable>>;
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

function squareCorners(side: "left" | "right"): ViewStyle {
  return side === "left"
    ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
    : { borderTopRightRadius: 0, borderBottomRightRadius: 0 };
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
    <CalendarPressable
      feedback="ring"
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
          // Square corners where an arrow joins, so no notch shows.
          ...(clippedStart && squareCorners(startSide)),
          ...(clippedEnd && squareCorners(endSide)),
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
    </CalendarPressable>
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
