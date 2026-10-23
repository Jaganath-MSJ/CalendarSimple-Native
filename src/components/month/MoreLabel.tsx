/**
 * @file Phone "+N" label under the bars (not pressable; the cell opens the
 * day sheet).
 */
import { StyleSheet, Text } from "react-native";
import { useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";

export interface MoreLabelProps {
  hidden: number;
  start: number;
  top: number;
  width: number;
  testID?: string;
}

export function MoreLabel({
  hidden,
  start,
  top,
  width,
  testID,
}: MoreLabelProps) {
  const cfg = useViewConfig();
  const { palette, metrics, flip } = useCalendarTheme();
  return (
    <Text
      testID={testID}
      accessibilityLabel={cfg.messages.more(hidden)}
      numberOfLines={1}
      maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
      pointerEvents="none"
      style={[
        styles.label,
        flip ? { right: start } : { left: start },
        {
          top,
          width,
          color: palette.textSecondary,
          fontSize: metrics.month.moreFontSize,
        },
        cfg.styles.moreLabel,
      ]}
    >
      {`+${hidden}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { position: "absolute", fontWeight: "600" },
});
