/**
 * @file Weekday header row and the week rows of the month grid.
 */
import { StyleSheet, View } from "react-native";
import { getDayListNames, type CalendarMatrix } from "../../core";
import { useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { WeekRow, type WeekRowProps } from "./WeekRow";
import { CalendarText } from "../ui/CalendarText";

export interface MonthGridProps<E extends CalendarEvent = CalendarEvent> {
  matrix: CalendarMatrix<E>;
  /** Props shared by every week row. */
  rowProps: Omit<WeekRowProps<E>, "row" | "rowIndex">;
}

export function MonthGrid<E extends CalendarEvent = CalendarEvent>({
  matrix,
  rowProps,
}: MonthGridProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette, metrics, flip } = useCalendarTheme();
  const columns = matrix[0]?.length ?? 7;
  const names = getDayListNames(cfg.dayType, cfg.locale);
  const { headerRowHeight, headerFontSize } = metrics.month;

  return (
    <>
      <View
        style={[
          styles.header,
          {
            flexDirection: flip ? "row-reverse" : "row",
            height: headerRowHeight,
            borderColor: palette.border,
          },
          cfg.styles.tableHeader,
        ]}
      >
        {rowProps.gutter > 0 ? (
          <View style={{ width: rowProps.gutter }} />
        ) : null}
        {Array.from({ length: columns }, (_, i) => (
          <CalendarText
            key={i}
            numberOfLines={1}
            style={[
              styles.dayName,
              {
                width: rowProps.cellWidth,
                color: palette.textSecondary,
                fontSize: headerFontSize,
              },
              cfg.styles.dayName,
            ]}
          >
            {(names[(cfg.weekStartsOn + i) % 7] ?? "").toUpperCase()}
          </CalendarText>
        ))}
      </View>
      <View style={styles.body}>
        {matrix.map((row, i) => (
          <WeekRow key={i} row={row} rowIndex={i} {...rowProps} />
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth },
  dayName: { textAlign: "center", fontWeight: "600" },
  body: { flex: 1 },
});
