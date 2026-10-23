/**
 * @file One day of the month grid: background, date label and state colours
 * (port spec §4.2, TDD §8.3).
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DATE_FORMATS,
  formatDate,
  resolveTheme,
  type CalendarDayInfo,
  type ThemeScheme,
} from "../../core";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";

export interface MonthCellProps<E extends CalendarEvent = CalendarEvent> {
  info: CalendarDayInfo<E>;
  width: number;
  height: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** `selectable && isCurrentMonth && same day as the selected date`. */
  selected?: boolean;
  /** Theme state colours resolved by the view; resolved here when omitted. */
  resolved?: ThemeScheme;
}

export function MonthCell<E extends CalendarEvent = CalendarEvent>({
  info,
  width,
  height,
  onPress,
  onLongPress,
  selected = false,
  resolved: resolvedProp,
}: MonthCellProps<E>) {
  const cfg = useViewConfig();
  const { colorScheme } = useCalendarConfig();
  const { palette, metrics, flip } = useCalendarTheme();
  const id = useTestID();
  const {
    currentDate,
    isCurrentMonth,
    displayDay,
    isToday,
    isTodayAdjacent,
    totalEvents,
  } = info;
  const { styles: own, messages, locale, renderDateCell } = cfg;

  const resolved = resolvedProp ?? resolveTheme(cfg.theme, colorScheme);
  const state = selected
    ? resolved.selected
    : isToday
      ? resolved.today
      : resolved.default;
  const showContents = isCurrentMonth || cfg.showAdjacentMonths;

  const { labelSize, labelFontSize } = metrics.month;
  const outlined = !isToday && (selected || isTodayAdjacent);
  const labelState = isToday
    ? { backgroundColor: palette.primary, color: palette.onPrimary }
    : selected
      ? {
          borderWidth: 1.5,
          borderColor: palette.primary,
          color: palette.primaryStrong,
        }
      : isTodayAdjacent
        ? {
            // #17C: muted, so it cannot be mistaken for the selected day.
            borderWidth: 1.5,
            borderColor: palette.textSecondary,
            color: palette.textSecondary,
          }
        : {
            color: isCurrentMonth ? palette.textPrimary : palette.textSecondary,
          };

  const label = renderDateCell ? (
    renderDateCell({
      date: currentDate.toJSDate(),
      isToday,
      isSelected: selected,
      isCurrentMonth,
    })
  ) : (
    <Text
      testID={id(`${displayDay}-month-label`)}
      maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
      style={[
        styles.label,
        {
          width: labelSize,
          height: labelSize,
          lineHeight: outlined ? labelSize - 3 : labelSize,
          borderRadius: labelSize / 2,
          fontSize: labelFontSize,
        },
        labelState,
        state?.color !== undefined && { color: state.color },
        selected && own.selected,
        isToday && own.today,
      ]}
    >
      {displayDay}
    </Text>
  );

  return (
    <Pressable
      testID={id(`${displayDay}-month-cell`)}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      accessibilityRole="button"
      accessibilityLabel={`${formatDate(currentDate, DATE_FORMATS.MONTH_DAY_YEAR, locale)}, ${messages.eventCount(totalEvents)}`}
      accessibilityState={{ selected }}
      style={[
        styles.cell,
        {
          width,
          borderColor: palette.border,
          backgroundColor:
            state?.bgColor ?? (isCurrentMonth ? palette.bg : palette.bgMuted),
        },
        height > 0 && { height },
        own.tableDate,
      ]}
    >
      {showContents ? (
        <View
          style={[
            styles.labelRow,
            { alignItems: flip ? "flex-start" : "flex-end" },
          ]}
        >
          {isToday && !renderDateCell ? (
            <View
              style={[
                styles.ring,
                {
                  borderColor: palette.primary,
                  borderRadius: labelSize / 2 + 2,
                },
              ]}
            >
              {label}
            </View>
          ) : (
            label
          )}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelRow: { paddingTop: 4, paddingHorizontal: 4 },
  label: { textAlign: "center", overflow: "hidden", fontWeight: "500" },
  ring: { borderWidth: 1, padding: 1, margin: -2 },
});
