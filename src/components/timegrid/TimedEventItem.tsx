/**
 * @file A timed event box in a day column (port spec §4.3, TDD §8.3).
 */
import { memo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import {
  DATE_FORMATS,
  ECalendarViewType,
  formatDate,
  generateTooltipText,
} from "../../core";
import { useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { pickEventStyle } from "../eventStyle";
import type { EventFrame } from "./positionEvent";

export interface TimedEventItemProps<E extends CalendarEvent = CalendarEvent> {
  event: E;
  frame: EventFrame;
  testID?: string;
}

function TimedEventItemImpl<E extends CalendarEvent = CalendarEvent>({
  event,
  frame,
  testID,
}: TimedEventItemProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette, metrics, flip, fontScale } = useCalendarTheme();
  const { messages, renderEvent, onEventClick, onEventLongPress } = cfg;
  const { smallEventHeight, tinyEventHeight, eventFontSize } = metrics.timeGrid;
  const colours = pickEventStyle(event.style, palette.eventDefault);
  const tooltip = generateTooltipText(
    event,
    ECalendarViewType.day,
    cfg.is12Hour,
    cfg.locale,
  );
  const tiny = frame.height < tinyEventHeight;
  const small = !tiny && frame.height < smallEventHeight;
  const fontSize = tiny
    ? 10 * Math.min(fontScale, cfg.maxFontSizeMultiplier)
    : eventFontSize;
  const time = formatDate(
    event.startDate,
    cfg.is12Hour ? DATE_FORMATS.TIME_12H : DATE_FORMATS.TIME,
    cfg.locale,
  );
  const text = { color: colours.color, fontSize };
  // Room for text inside the 1 px border and the variant's padding. Below
  // ~2 characters only fragments ("C", "'") would show, so draw no text;
  // the time needs ~3 characters and only shows in the column variant.
  const pad = tiny ? 4 : small ? 5 : 6;
  const inner = frame.width - 2 * pad - 2;
  const showTitle = inner >= fontSize * 2;
  const showTime = !tiny && !small && inner >= fontSize * 3;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${event.title || messages.noTitle}, ${tooltip}`}
      onPress={() => onEventClick?.(event)}
      onLongPress={() => onEventLongPress?.(event)}
      delayLongPress={500}
      style={[
        styles.item,
        tiny ? styles.tiny : small ? styles.small : styles.column,
        {
          top: frame.top,
          height: frame.height,
          width: frame.width,
          zIndex: frame.zIndex,
          // 1 px outline in the grid colour separates overlapping items.
          borderColor: palette.bg,
        },
        flip ? { right: frame.left } : { left: frame.left },
        colours,
        cfg.styles.event,
      ]}
    >
      {renderEvent ? (
        renderEvent(event)
      ) : showTitle ? (
        <>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
            ellipsizeMode="tail"
            style={[styles.title, text]}
          >
            {event.title || messages.noTitle}
          </Text>
          {showTime ? (
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={cfg.maxFontSizeMultiplier}
              style={[styles.time, text]}
            >
              {time}
            </Text>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

export const TimedEventItem = memo(
  TimedEventItemImpl,
) as typeof TimedEventItemImpl;

const styles = StyleSheet.create({
  item: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: 1,
  },
  column: { paddingVertical: 2, paddingHorizontal: 6 },
  small: { justifyContent: "center", paddingVertical: 2, paddingHorizontal: 5 },
  tiny: { paddingVertical: 1, paddingHorizontal: 4, justifyContent: "center" },
  title: { fontWeight: "600" },
  time: { opacity: 0.9 },
});
