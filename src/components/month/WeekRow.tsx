/**
 * @file One week of the month grid: optional week number, day cells and the
 * event overlay.
 */
import { StyleSheet, Text, View } from "react-native";
import type { CalendarDayInfo, ThemeScheme } from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { MonthCell } from "./MonthCell";
import { WeekBarsOverlay, type WeekBarsOverlayProps } from "./WeekBarsOverlay";

export interface WeekRowProps<E extends CalendarEvent = CalendarEvent> {
  row: CalendarDayInfo<E>[];
  rowIndex: number;
  cellWidth: number;
  height: number;
  /** Week-number column width (0 when hidden). */
  gutter: number;
  /** `chip` on compact and wide, `bar` on phone. */
  variant: "chip" | "bar";
  maxSlots: number;
  isSelected: (info: CalendarDayInfo<E>) => boolean;
  onCellPress: (info: CalendarDayInfo<E>) => void;
  onCellLongPress?: (info: CalendarDayInfo<E>) => void;
  onMorePress?: WeekBarsOverlayProps<E>["onMorePress"];
  /** Theme state colours, resolved once by the view. */
  resolved?: ThemeScheme;
}

export function WeekRow<E extends CalendarEvent = CalendarEvent>({
  row,
  rowIndex,
  cellWidth,
  height,
  gutter,
  variant,
  maxSlots,
  isSelected,
  onCellPress,
  onCellLongPress,
  onMorePress,
  resolved,
}: WeekRowProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette, metrics, flip } = useCalendarTheme();
  const id = useTestID();
  const first = row[0];
  const blankWeek =
    !cfg.showAdjacentMonths && row.every((d) => !d.isCurrentMonth);

  return (
    <View
      style={[
        styles.row,
        { flexDirection: flip ? "row-reverse" : "row" },
        height > 0 ? { height } : styles.flex,
      ]}
    >
      {gutter > 0 ? (
        <View
          testID={id(`${rowIndex}-week-number`)}
          style={[
            styles.weekNumber,
            { width: gutter, borderColor: palette.border },
            cfg.styles.weekNumber,
          ]}
        >
          <Text
            maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
            style={{
              color: palette.textSecondary,
              fontSize: metrics.month.labelFontSize,
            }}
          >
            {first && !blankWeek ? String(first.currentDate.weekNumber) : ""}
          </Text>
        </View>
      ) : null}
      {row.map((info) => (
        <MonthCell
          key={info.currentDate.toISODate()}
          info={info}
          width={cellWidth}
          height={height}
          selected={isSelected(info)}
          onPress={() => onCellPress(info)}
          onLongPress={onCellLongPress && (() => onCellLongPress(info))}
          resolved={resolved}
        />
      ))}
      <WeekBarsOverlay
        row={row}
        cellWidth={cellWidth}
        gutter={gutter}
        variant={variant}
        maxSlots={maxSlots}
        onMorePress={onMorePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: "relative" },
  flex: { flex: 1 },
  weekNumber: {
    alignItems: "center",
    paddingTop: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
