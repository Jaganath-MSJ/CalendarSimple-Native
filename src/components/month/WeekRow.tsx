/**
 * @file One week of the month grid: optional week number, day cells and the
 * event overlay.
 */
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import type { CalendarDayInfo, ThemeScheme } from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { MonthCell } from "./MonthCell";
import {
  WeekBarsOverlay,
  type MonthDrag,
  type WeekBarsOverlayProps,
} from "./WeekBarsOverlay";
import { CalendarText } from "../ui/CalendarText";
import type { FocusAnchor } from "../ui/focusReturn";

/** Web roving focus: the tab-stop day and the move counter (MonthView). */
export interface GridKeyboard<E extends CalendarEvent = CalendarEvent> {
  /** ISO date of the cell that is the tab stop. */
  focusIso: string;
  /** Increases on each key move; the tab-stop cell then takes focus. */
  focusToken: number;
  onFocus: (info: CalendarDayInfo<E>) => void;
}

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
  onCellPress: (info: CalendarDayInfo<E>, anchor: FocusAnchor) => void;
  onCellLongPress?: (info: CalendarDayInfo<E>) => void;
  onMorePress?: WeekBarsOverlayProps<E>["onMorePress"];
  /** Theme state colours, resolved once by the view. */
  resolved?: ThemeScheme;
  /** Web keyboard navigation; `undefined` when off. */
  keyboard?: GridKeyboard<E>;
  /** Moving chips (`draggable`); `undefined` when off. */
  drag?: MonthDrag<E>;
}

function WeekRowImpl<E extends CalendarEvent = CalendarEvent>({
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
  keyboard,
  drag,
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
          <CalendarText
            style={{
              color: palette.textSecondary,
              fontSize: metrics.month.labelFontSize,
            }}
          >
            {first && !blankWeek ? String(first.currentDate.weekNumber) : ""}
          </CalendarText>
        </View>
      ) : null}
      {row.map((info) => {
        const iso = info.currentDate.toISODate();
        const focused = keyboard ? iso === keyboard.focusIso : undefined;
        return (
          <MonthCell
            key={iso}
            info={info}
            width={cellWidth}
            height={height}
            selected={isSelected(info)}
            onPress={onCellPress}
            onLongPress={onCellLongPress}
            resolved={resolved}
            tabStop={focused}
            focusToken={focused ? keyboard?.focusToken : undefined}
            onFocus={keyboard?.onFocus}
          />
        );
      })}
      <WeekBarsOverlay
        row={row}
        rowIndex={rowIndex}
        drag={drag}
        cellWidth={cellWidth}
        gutter={gutter}
        variant={variant}
        maxSlots={maxSlots}
        onMorePress={onMorePress}
      />
    </View>
  );
}

/** Memoised (TDD §13); its callbacks must be stable. */
export const WeekRow = memo(WeekRowImpl) as typeof WeekRowImpl;

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
