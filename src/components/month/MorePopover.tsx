/**
 * @file Every event of a month day in an anchored popover (port spec §4.6).
 */
import { ScrollView, StyleSheet } from "react-native";
import {
  DATE_FORMATS,
  ECalendarViewType,
  formatDate,
  generateTooltipText,
  getLastEventDay,
  getStartOfDay,
  type CalendarDayInfo,
} from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { originalOf } from "../../hooks/useMonthGrid";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { pickEventStyle } from "../eventStyle";
import { AnchoredPopover } from "../ui/AnchoredPopover";
import { ArrowChip } from "../ui/ArrowChip";
import type { Frame } from "../ui/placePopover";
import { CalendarText } from "../ui/CalendarText";
import type { FocusAnchor } from "../ui/focusReturn";

export const POPOVER_WIDTH = 220;
const LIST_MAX_HEIGHT = 250;

export interface MorePopoverProps<E extends CalendarEvent = CalendarEvent> {
  day: CalendarDayInfo<E> | null;
  anchor: Frame | null;
  onClose: () => void;
  /** Gets screen-reader focus back on close. */
  returnFocusTo?: FocusAnchor;
}

export function MorePopover<E extends CalendarEvent = CalendarEvent>({
  day,
  anchor,
  onClose,
  returnFocusTo,
}: MorePopoverProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette, metrics } = useCalendarTheme();
  const id = useTestID();
  if (!day) return null;
  const date = day.currentDate;
  const short = formatDate(date, DATE_FORMATS.DAY_DATE_SHORT_MONTH, cfg.locale);
  const events = day.events
    .filter((e) => e !== null)
    .map((e) => originalOf<E>(e));

  return (
    <AnchoredPopover
      visible
      anchor={anchor}
      width={POPOVER_WIDTH}
      onClose={onClose}
      testID={id("popover")}
      contentTestID={id("popover-content")}
      label={cfg.messages.eventsOn(short)}
      style={cfg.styles.popover}
      returnFocusTo={returnFocusTo}
    >
      <CalendarText style={[styles.header, { color: palette.textSecondary }]}>
        {short.toUpperCase()}
      </CalendarText>
      <ScrollView style={{ maxHeight: LIST_MAX_HEIGHT }}>
        {events.map((event, i) => {
          const colours = pickEventStyle(event.style, palette.eventDefault);
          const tooltip = generateTooltipText(
            event,
            ECalendarViewType.month,
            cfg.is12Hour,
            cfg.locale,
          );
          return (
            <ArrowChip
              key={event.id ?? `${event.startDate}-${i}`}
              testID={id(
                `${event.id ?? `${event.startDate}-${i}`}-popover-item`,
              )}
              clippedStart={
                getStartOfDay(event.startDate) < date.startOf("day")
              }
              clippedEnd={getLastEventDay(event) > date.startOf("day")}
              backgroundColor={colours.backgroundColor}
              height={metrics.month.chipHeight}
              accessibilityLabel={`${event.title || cfg.messages.noTitle}, ${tooltip}`}
              onPress={() => {
                onClose();
                cfg.onEventClick?.(event);
              }}
              onLongPress={() => cfg.onEventLongPress?.(event)}
              style={[styles.item, cfg.styles.event]}
            >
              {cfg.renderEvent ? (
                cfg.renderEvent(event)
              ) : (
                <CalendarText
                  numberOfLines={1}
                  style={{
                    color: colours.color,
                    fontSize: metrics.month.chipFontSize,
                  }}
                >
                  {event.title}
                </CalendarText>
              )}
            </ArrowChip>
          );
        })}
      </ScrollView>
    </AnchoredPopover>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  item: { marginBottom: 2 },
});
