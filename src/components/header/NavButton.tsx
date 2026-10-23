/**
 * @file Previous/next chevron button of the header (port spec §4.1).
 */
import { Pressable, StyleSheet, Text } from "react-native";
import { useCalendarTheme } from "../../theme";

export interface NavButtonProps {
  direction: "prev" | "next";
  onPress: () => void;
  testID: string;
  accessibilityLabel: string;
}

/**
 * A chevron drawn at `metrics.header.controlHeight`, with `hitSlop` reaching
 * `metrics.touchTarget`. The chevron is mirrored when the calendar flips.
 */
export function NavButton({
  direction,
  onPress,
  testID,
  accessibilityLabel,
}: NavButtonProps) {
  const { palette, metrics, flip } = useCalendarTheme();
  const size = metrics.header.controlHeight;
  const slop = Math.max(0, Math.ceil((metrics.touchTarget - size) / 2));
  const pointsLeft = (direction === "prev") !== flip;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={slop}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? palette.bgMuted : "transparent",
        },
      ]}
    >
      <Text
        style={[styles.chevron, { color: palette.textSecondary }]}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {pointsLeft ? "‹" : "›"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", justifyContent: "center" },
  chevron: { fontSize: 24, lineHeight: 28 },
});
