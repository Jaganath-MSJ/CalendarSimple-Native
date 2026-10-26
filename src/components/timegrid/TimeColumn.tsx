/**
 * @file Hour labels down the start edge of the time grid (port spec §4.3).
 */
import { StyleSheet, View } from "react-native";
import { buildLabelCache } from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import { TIME_GUTTER } from "./columnLayout";
import { CalendarText } from "../ui/CalendarText";

export function TimeColumn({ hourHeight }: { hourHeight: number }) {
  const cfg = useViewConfig();
  const { palette, metrics } = useCalendarTheme();
  const id = useTestID();
  const { minHour, maxHour, locale, is12Hour, dayType } = cfg;
  const { hourLabels } = buildLabelCache(locale, is12Hour, dayType);
  const hours = Array.from(
    { length: Math.max(0, maxHour - minHour) },
    (_, i) => minHour + i,
  );
  return (
    <View
      testID={id("time-column")}
      style={[styles.column, cfg.styles.timeColumn]}
    >
      {hours.map((h) => (
        <View key={h} style={{ height: hourHeight }}>
          <CalendarText
            style={[
              styles.label,
              {
                color: palette.textSecondary,
                fontSize: metrics.timeGrid.eventFontSize,
              },
              cfg.styles.timeSlot,
            ]}
          >
            {hourLabels[h]}
          </CalendarText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: TIME_GUTTER },
  label: { textAlign: "center", paddingTop: 2 },
});
