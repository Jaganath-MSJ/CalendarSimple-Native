/**
 * @file Option A day sheet (phone): the day's events in schedule order and,
 * when `creatable`, a "New event" row (TDD §9).
 */
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  DATE_FORMATS,
  ECalendarViewType,
  formatDate,
  generateTooltipText,
  getScheduleTimeLabel,
  getScheduleTitle,
  groupScheduleEvents,
  type DateType,
} from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useNow } from "../../hooks/useNow";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { pickEventStyle } from "../eventStyle";
import { Sheet } from "../ui/Sheet";

const TIME_WIDTH = 96;
const DOT = 10;

export interface DayEventsSheetProps<E extends CalendarEvent = CalendarEvent> {
  day: DateType | null;
  events: E[];
  onClose: () => void;
}

export function DayEventsSheet<E extends CalendarEvent = CalendarEvent>({
  day,
  events,
  onClose,
}: DayEventsSheetProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette, metrics } = useCalendarTheme();
  const id = useTestID();
  const now = useNow();
  const dayEvents = useMemo(
    () =>
      day
        ? (groupScheduleEvents(events, { start: day, end: day })[0]?.events ??
          [])
        : [],
    [day, events],
  );
  if (!day) return null;

  const { messages, locale, is12Hour } = cfg;
  const short = formatDate(day, DATE_FORMATS.DAY_DATE_SHORT_MONTH, locale);
  const title =
    short.toUpperCase() +
    (day.hasSame(now, "day") ? ` · ${messages.today.toUpperCase()}` : "");
  const rowHeight = Math.max(metrics.sheet.rowHeight, metrics.touchTarget);
  const text = { color: palette.textPrimary };
  const muted = { color: palette.textSecondary };

  return (
    <Sheet
      visible
      onClose={onClose}
      testID={id("day-sheet")}
      label={messages.eventsOn(short)}
    >
      <View style={[styles.header, cfg.styles.daySheet]}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
          style={[styles.title, text]}
        >
          {title}
        </Text>
        <Text maxFontSizeMultiplier={cfg.maxFontSizeMultiplier} style={muted}>
          {messages.eventCount(dayEvents.length)}
        </Text>
      </View>
      <ScrollView>
        {dayEvents.map((event, i) => {
          const key = event.id ?? `${event.startDate}-${i}`;
          const tooltip = generateTooltipText(
            event,
            ECalendarViewType.month,
            is12Hour,
            locale,
          );
          return (
            <Pressable
              key={key}
              testID={id(`${key}-day-sheet-item`)}
              accessibilityRole="button"
              accessibilityLabel={`${event.title || messages.noTitle}, ${tooltip}`}
              onPress={() => {
                onClose();
                cfg.onEventClick?.(event);
              }}
              onLongPress={() => cfg.onEventLongPress?.(event)}
              style={({ pressed }) => [
                styles.row,
                { height: rowHeight },
                pressed && { backgroundColor: palette.bgMuted },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: pickEventStyle(
                      event.style,
                      palette.eventDefault,
                    ).backgroundColor,
                  },
                ]}
              />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
                style={[styles.time, muted]}
              >
                {getScheduleTimeLabel(event, day, {
                  is12Hour,
                  locale,
                  messages,
                })}
              </Text>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
                style={[styles.eventTitle, text]}
              >
                {getScheduleTitle(event, day, messages)}
              </Text>
            </Pressable>
          );
        })}
        {cfg.creatable ? (
          <Pressable
            testID={id("day-sheet-new-event")}
            accessibilityRole="button"
            accessibilityLabel={messages.newEvent}
            onPress={() => {
              onClose();
              cfg.onSlotClick?.(
                day.startOf("day").toJSDate(),
                day.endOf("day").toJSDate(),
              );
            }}
            style={({ pressed }) => [
              styles.row,
              { height: rowHeight },
              pressed && { backgroundColor: palette.bgMuted },
            ]}
          >
            <Text
              maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
              style={[styles.newEvent, { color: palette.primary }]}
            >
              {`+ ${messages.newEvent}`}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 2 },
  title: { fontSize: 13, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  time: { width: TIME_WIDTH, fontSize: 13 },
  eventTitle: { flex: 1, fontSize: 15 },
  newEvent: { fontSize: 15, fontWeight: "600" },
});
