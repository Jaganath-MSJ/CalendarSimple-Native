/**
 * @file A month event: a titled chip (compact, wide) or a 6 px bar (phone).
 */
import { StyleSheet, View } from "react-native";
import { ECalendarViewType, generateTooltipText } from "../../core";
import { useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { pickEventStyle } from "../eventStyle";
import { CalendarText } from "../ui/CalendarText";
import { CalendarPressable } from "../ui/CalendarPressable";
import { useDraggable, type DragSpec } from "../drag/useDraggable";

export interface EventChipProps<E extends CalendarEvent = CalendarEvent> {
  /** The app's own event object. */
  event: E;
  variant: "chip" | "bar";
  /** Distance from the row's start edge (`left`, or `right` when flipped). */
  start: number;
  top: number;
  width: number;
  height: number;
  testID?: string;
  /** Set when the chip may move (`draggable`, chip variant). */
  drag?: DragSpec;
}

export function EventChip<E extends CalendarEvent = CalendarEvent>({
  event,
  variant,
  start,
  top,
  width,
  height,
  testID,
  drag,
}: EventChipProps<E>) {
  const draggable = useDraggable(drag);
  const cfg = useViewConfig<E>();
  const { palette, metrics, flip } = useCalendarTheme();
  const { messages, renderEvent, onEventClick, onEventLongPress } = cfg;
  const colours = pickEventStyle(event.style, palette.eventDefault);
  const tooltip = generateTooltipText(
    event,
    ECalendarViewType.month,
    cfg.is12Hour,
    cfg.locale,
  );
  const bar = variant === "bar";
  const place = [
    flip ? { right: start } : { left: start },
    { top, width, height },
  ];
  const look = [
    {
      borderRadius: bar ? height / 2 : 4,
      borderWidth: colours.borderColor ? 1 : 0,
    },
    colours,
    cfg.styles.event,
  ];
  const frame = [styles.chip, place, look];
  // Phone bars are decoration only: the cell opens the day sheet, whose rows
  // carry the event callbacks and labels.
  if (bar) {
    return (
      <View
        testID={testID}
        pointerEvents="none"
        accessible={false}
        style={frame}
      />
    );
  }
  return draggable.wrap(
    [styles.slot, place],
    <CalendarPressable
      feedback="ring"
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${event.title || messages.noTitle}, ${tooltip}`}
      accessibilityActions={draggable.accessibilityActions}
      onAccessibilityAction={draggable.onAccessibilityAction}
      {...draggable.keys}
      {...draggable.press(
        () => onEventClick?.(event),
        () => onEventLongPress?.(event),
      )}
      style={
        draggable.wrapped
          ? [styles.chip, { top: 0, left: 0, width, height }, look]
          : frame
      }
    >
      {renderEvent ? (
        renderEvent(event)
      ) : (
        <CalendarText
          numberOfLines={1}
          style={[
            styles.title,
            { color: colours.color, fontSize: metrics.month.chipFontSize },
          ]}
        >
          {event.title}
        </CalendarText>
      )}
    </CalendarPressable>,
  );
}

const styles = StyleSheet.create({
  slot: { position: "absolute", zIndex: 2 },
  chip: {
    position: "absolute",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 2,
  },
  title: { fontWeight: "500", paddingHorizontal: 6 },
});
