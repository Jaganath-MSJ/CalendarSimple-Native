/**
 * @file The current-time line in today's column (port spec §4.3).
 */
import { StyleSheet, View } from "react-native";
import { useTestID } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";

/** Dot diameter. */
const DOT = 12;
/** Line thickness. */
const LINE = 2;

export function NowLine({ top }: { top: number }) {
  const { palette, flip } = useCalendarTheme();
  const id = useTestID();
  return (
    <View
      testID={id("current-time-line")}
      pointerEvents="none"
      accessible={false}
      style={[styles.line, { top, backgroundColor: palette.nowLine }]}
    >
      <View
        style={[
          styles.dot,
          flip ? { right: -DOT / 2 } : { left: -DOT / 2 },
          { backgroundColor: palette.nowLine },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    position: "absolute",
    left: 0,
    right: 0,
    height: LINE,
    zIndex: 10,
  },
  dot: {
    position: "absolute",
    top: (LINE - DOT) / 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
});
