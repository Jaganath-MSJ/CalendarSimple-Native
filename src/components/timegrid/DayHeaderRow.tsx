/**
 * @file Day headers above the time grid (port spec §4.3, TDD §10.2).
 */
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import {
  DATE_FORMATS,
  formatDate,
  getDayOfWeek,
  getDayListNames,
  resolveTheme,
  type DateType,
} from "../../core";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import { CalendarText } from "../ui/CalendarText";

export interface DayHeaderRowProps {
  days: DateType[];
  variant: "week" | "day" | "custom";
  colWidth: number;
  /** `now.toISODate()`. */
  today: string;
}

export function DayHeaderRow({
  days,
  variant,
  colWidth,
  today,
}: DayHeaderRowProps) {
  const cfg = useViewConfig();
  const { colorScheme } = useCalendarConfig();
  const { palette, metrics, breakpoint, flip } = useCalendarTheme();
  const id = useTestID();
  const { styles: own, renderDateCell, locale } = cfg;
  const names = getDayListNames(cfg.dayType, locale);
  const todayTheme = resolveTheme(cfg.theme, colorScheme).today;
  const { dayNameFontSize, dayNumberFontSize, customCircle } = metrics.timeGrid;
  // TDD §10.2: phone Day header number 16; custom wide number 18.
  const numberSize =
    variant === "day" && breakpoint === "phone"
      ? (dayNumberFontSize * 16) / 15
      : variant === "custom" && breakpoint === "wide"
        ? (dayNumberFontSize * 18) / 20
        : dayNumberFontSize;

  return (
    <View style={[styles.row, flip && styles.flipped]}>
      {days.map((date) => {
        const iso = date.toISODate() ?? "";
        const isToday = iso === today;
        if (renderDateCell) {
          return (
            <Fragment key={iso}>
              {renderDateCell({ date: date.toJSDate(), isToday })}
            </Fragment>
          );
        }
        const number = formatDate(date, DATE_FORMATS.DAY_NUMBER, locale);
        const circle = variant === "custom";
        return (
          <View
            key={iso}
            testID={id(`${iso}-day-header`)}
            accessible
            accessibilityRole="header"
            accessibilityLabel={formatDate(
              date,
              DATE_FORMATS.MONTH_DAY_YEAR,
              locale,
            )}
            style={[styles.cell, { width: colWidth }, own.dayHeader]}
          >
            <CalendarText
              style={[
                styles.name,
                {
                  fontSize: dayNameFontSize,
                  color:
                    isToday && !circle
                      ? palette.primary
                      : palette.textSecondary,
                },
                own.dayName,
              ]}
            >
              {(names[getDayOfWeek(date)] ?? "").toUpperCase()}
            </CalendarText>
            <CalendarText
              style={[
                styles.number,
                { fontSize: numberSize, color: palette.textPrimary },
                circle && {
                  width: customCircle,
                  height: customCircle,
                  lineHeight: customCircle,
                  borderRadius: customCircle / 2,
                },
                isToday &&
                  (circle
                    ? {
                        backgroundColor: palette.primary,
                        color: palette.onPrimary,
                      }
                    : { color: palette.primary, fontWeight: "700" }),
                isToday &&
                  todayTheme?.color !== undefined && {
                    color: todayTheme.color,
                  },
                isToday &&
                  todayTheme?.bgColor !== undefined && {
                    backgroundColor: todayTheme.bgColor,
                  },
                own.dayNumber,
                isToday && own.today,
              ]}
            >
              {number}
            </CalendarText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  flipped: { flexDirection: "row-reverse" },
  cell: { alignItems: "center", paddingVertical: 6 },
  name: { fontWeight: "600" },
  number: { textAlign: "center", fontWeight: "500", overflow: "hidden" },
});
