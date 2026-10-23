/**
 * @file One schedule row: the date column (first row of a day only), then a
 * dot, the time and the title, or `renderEvent(event)` (port spec §4.5).
 */
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import {
  DATE_FORMATS,
  formatDate,
  getScheduleTimeLabel,
  getScheduleTitle,
  resolveTheme,
  type DateType,
} from "../../core";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { pickEventStyle } from "../eventStyle";
import { CalendarText } from "../ui/CalendarText";
import { CalendarPressable } from "../ui/CalendarPressable";

const DOT = 8;

export interface ScheduleRowProps<E extends CalendarEvent = CalendarEvent> {
  event: E;
  day: DateType;
  /** `day.toISODate()`; names the section test ID on the first row. */
  dateKey: string;
  /** First row of its day: shows the date column. */
  first: boolean;
  /** Last row of its day: draws the group's bottom border (unless separated). */
  last: boolean;
  /** `renderScheduleSeparator` is set (it replaces the bottom border). */
  separated: boolean;
  isToday: boolean;
  /** Row height when `renderEvent` is not set. */
  height: number;
}

function ScheduleRowInner<E extends CalendarEvent>({
  event,
  day,
  dateKey,
  first,
  last,
  separated,
  isToday,
  height,
}: ScheduleRowProps<E>) {
  const cfg = useViewConfig<E>();
  const { colorScheme } = useCalendarConfig();
  const { palette, metrics, flip } = useCalendarTheme();
  const id = useTestID();
  const { messages, locale, is12Hour, styles: own, renderEvent } = cfg;
  const m = metrics.schedule;
  const todayTheme = resolveTheme(cfg.theme, colorScheme).today;

  const time = getScheduleTimeLabel(event, day, {
    is12Hour,
    locale,
    messages,
  });
  const title = getScheduleTitle(event, day, messages);
  const dayLabel = formatDate(day, DATE_FORMATS.DAY_DATE_SHORT_MONTH, locale);
  const picked = pickEventStyle(event.style, palette.eventDefault);
  const key = event.id ?? `${event.startDate}`;

  return (
    <View
      testID={first ? id(`${dateKey}-schedule-section`) : undefined}
      style={[
        styles.row,
        flip && styles.reverse,
        !renderEvent && { height },
        last &&
          !separated && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: palette.border,
          },
        first && own.scheduleDateGroup,
      ]}
    >
      <View style={[styles.dateCol, { width: m.dateWidth }]}>
        {first ? (
          <>
            <View
              style={[
                styles.circle,
                {
                  width: m.circle,
                  height: m.circle,
                  borderRadius: m.circle / 2,
                },
                isToday && { backgroundColor: palette.primary },
                isToday &&
                  todayTheme?.bgColor !== undefined && {
                    backgroundColor: todayTheme.bgColor,
                  },
              ]}
            >
              <CalendarText
                style={[
                  styles.number,
                  { fontSize: m.numberFontSize, color: palette.textPrimary },
                  isToday && { color: palette.onPrimary },
                  isToday &&
                    todayTheme?.color !== undefined && {
                      color: todayTheme.color,
                    },
                  isToday && own.today,
                  own.scheduleDateNumber,
                ]}
              >
                {formatDate(day, DATE_FORMATS.DAY_NUMBER, locale)}
              </CalendarText>
            </View>
            <CalendarText
              testID={id("date-info")}
              style={[
                styles.subInfo,
                { fontSize: m.timeFontSize, color: palette.textSecondary },
                own.scheduleDateSubInfo,
              ]}
            >
              {`${formatDate(day, DATE_FORMATS.SHORT_MONTH, locale)}, ${formatDate(
                day,
                DATE_FORMATS.SHORT_DAY,
                locale,
              )}`.toUpperCase()}
            </CalendarText>
          </>
        ) : null}
      </View>
      <CalendarPressable
        testID={id(`${key}-schedule-event`)}
        accessibilityRole="button"
        accessibilityLabel={`${title || messages.noTitle}, ${dayLabel}, ${time}`}
        onPress={() => cfg.onEventClick?.(event)}
        onLongPress={() => cfg.onEventLongPress?.(event)}
        style={({ pressed }) => [
          styles.body,
          flip && styles.reverse,
          { minHeight: metrics.touchTarget },
          pressed && { backgroundColor: palette.bgMuted },
        ]}
      >
        {renderEvent ? (
          renderEvent(event)
        ) : (
          <>
            <View
              style={[
                styles.timeCol,
                flip && styles.reverse,
                { width: m.timeWidth },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: picked.backgroundColor },
                ]}
              />
              <CalendarText
                numberOfLines={1}
                style={[
                  styles.time,
                  { fontSize: m.timeFontSize, color: palette.textSecondary },
                  own.scheduleTime,
                ]}
              >
                {time}
              </CalendarText>
            </View>
            <CalendarText
              numberOfLines={1}
              style={[
                flip ? styles.titleFlipped : styles.title,
                {
                  fontSize: m.titleFontSize,
                  // The event's own text colour; no chip background behind it.
                  color: event.style?.color ?? palette.textPrimary,
                },
                own.scheduleTitle,
              ]}
            >
              {title}
            </CalendarText>
          </>
        )}
      </CalendarPressable>
    </View>
  );
}

export const ScheduleRow = memo(ScheduleRowInner) as typeof ScheduleRowInner;

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch" },
  dateCol: { alignItems: "center", paddingTop: 6, gap: 2 },
  circle: { alignItems: "center", justifyContent: "center" },
  number: { fontWeight: "600" },
  subInfo: { fontWeight: "500" },
  body: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  timeCol: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  time: { flexShrink: 1 },
  title: { flex: 1, paddingEnd: 12 },
  // Start/end swap only when the calendar flips (TDD §8.1).
  titleFlipped: { flex: 1, paddingStart: 12 },
  reverse: { flexDirection: "row-reverse" },
});
