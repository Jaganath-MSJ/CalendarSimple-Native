/**
 * @file One day of the time grid: hour cells, creatable slots, events and the
 * now-line (TDD §8.3, §8.7).
 */
import { memo, useCallback, useMemo, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from "react-native";
import {
  DATE_FORMATS,
  formatDate,
  type DateType,
  type DayEventLayout,
} from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { NowLine } from "./NowLine";
import { positionEvent } from "./positionEvent";
import { slotFromY } from "./slotFromY";
import { TimedEventItem } from "./TimedEventItem";
import { CalendarPressable } from "../ui/CalendarPressable";

export interface DayColumnProps<E extends CalendarEvent = CalendarEvent> {
  /** Start of the day. */
  date: DateType;
  layouts: DayEventLayout<E>[];
  colWidth: number;
  hourHeight: number;
  /** Now-line offset in px, or `null` when not drawn in this column. */
  nowTop: number | null;
  /** One labelled `Pressable` per hour instead of one column press target. */
  screenReader: boolean;
}

/** One hour cell; memoised so `renderHourCell` runs once per slot. */
const HourCell = memo(function HourCell({
  slotStart,
  height,
  border,
  renderHourCell,
}: {
  slotStart: number;
  height: number;
  border: string;
  renderHourCell?: (slotStart: Date) => ReactNode;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.hour, { height, borderBottomColor: border }]}
    >
      {renderHourCell?.(new Date(slotStart))}
    </View>
  );
});

function DayColumnImpl<E extends CalendarEvent = CalendarEvent>({
  date,
  layouts,
  colWidth,
  hourHeight,
  nowTop,
  screenReader,
}: DayColumnProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette } = useCalendarTheme();
  const id = useTestID();
  const {
    minHour,
    maxHour,
    creatable,
    onSlotClick,
    slotPressMode,
    renderHourCell,
    messages,
    locale,
  } = cfg;
  const hours = Array.from(
    { length: Math.max(0, maxHour - minHour) },
    (_, i) => minHour + i,
  );
  const height = hours.length * hourHeight;
  const day = useMemo(() => date.startOf("day"), [date]);
  const iso = day.toISODate() ?? "";
  const canCreate = creatable && !!onSlotClick;

  const createAt = useCallback(
    (hour: number) => {
      // Wall-clock hour, so DST days keep the printed slot.
      const start = day.set({ hour });
      onSlotClick?.(start.toJSDate(), start.plus({ hours: 1 }).toJSDate());
    },
    [day, onSlotClick],
  );
  const onColumnPress = useCallback(
    (e: GestureResponderEvent) => {
      const hour = slotFromY(e.nativeEvent.locationY, minHour, hourHeight);
      createAt(Math.min(Math.max(hour, minHour), maxHour - 1));
    },
    [createAt, minHour, maxHour, hourHeight],
  );

  const cells = hours.map((h) => (
    <HourCell
      key={h}
      slotStart={day.set({ hour: h }).toMillis()}
      height={hourHeight}
      border={palette.border}
      renderHourCell={renderHourCell}
    />
  ));

  const slots =
    canCreate && screenReader
      ? hours.map((h) => {
          const start = day.set({ hour: h });
          return (
            <CalendarPressable
              key={h}
              testID={id(`${iso}-${h}-slot`)}
              accessibilityRole="button"
              accessibilityLabel={messages.createEventAt(
                formatDate(start, DATE_FORMATS.TIME, locale),
                formatDate(start, DATE_FORMATS.DAY_DATE_SHORT_MONTH, locale),
              )}
              onPress={
                slotPressMode === "press" ? () => createAt(h) : undefined
              }
              onLongPress={
                slotPressMode === "longPress" ? () => createAt(h) : undefined
              }
              delayLongPress={500}
              style={[
                styles.slot,
                { top: (h - minHour) * hourHeight, height: hourHeight },
              ]}
            />
          );
        })
      : null;

  // Stable frames, so a now-line move does not re-render the events.
  const frames = useMemo(
    () => layouts.map((l) => positionEvent(l, colWidth, hourHeight)),
    [layouts, colWidth, hourHeight],
  );
  const events = layouts.map((l, i) => {
    const base = l.event.id ?? `${l.event.startDate}-${i}`;
    return (
      <TimedEventItem
        key={`${base}-${i}`}
        event={l.event}
        frame={frames[i]!}
        testID={id(`${base}-day-event-item`)}
      />
    );
  });

  const frame = [
    styles.column,
    { width: colWidth, height, borderStartColor: palette.border },
    cfg.styles.dayColumn,
  ];
  const content = (
    <>
      {cells}
      {slots}
      {events}
      {nowTop !== null ? <NowLine top={nowTop} /> : null}
    </>
  );

  if (!canCreate || screenReader) {
    return (
      <View testID={id("day-column")} style={frame}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={id("day-column")}
      accessible={false}
      onPress={slotPressMode === "press" ? onColumnPress : undefined}
      onLongPress={slotPressMode === "longPress" ? onColumnPress : undefined}
      delayLongPress={500}
      style={frame}
    >
      {content}
    </Pressable>
  );
}

export const DayColumn = memo(DayColumnImpl) as typeof DayColumnImpl;

const styles = StyleSheet.create({
  column: { borderStartWidth: StyleSheet.hairlineWidth },
  hour: { borderBottomWidth: StyleSheet.hairlineWidth },
  slot: { position: "absolute", left: 0, right: 0 },
});
