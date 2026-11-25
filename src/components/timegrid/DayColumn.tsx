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
  cellsMoved,
  dateFn,
  DATE_FORMATS,
  formatDate,
  getAxisBounds,
  isAllDayEvent,
  stepsMoved,
  type DateType,
  type DayEventLayout,
  type ResizeEdge,
} from "../../core";
import type { EventMover } from "../../hooks/useEventMover";
import type { DragSpec } from "../drag/useDraggable";
import { eventFocus } from "../drag/focusAfterMove";
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
  /** Moving events (`draggable`): the mover and this column's place. */
  drag?: { mover: EventMover<E>; index: number; count: number };
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
  drag,
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
  // Stable drag specs (TimedEventItem is memoised). Moving: up and down in
  // dragSnapMinutes steps inside the grid, sideways across the visible days.
  // Resizing: an edge moves in resizeSnapMinutes steps, inside the grid and
  // never below minEventDurationMinutes; only edges inside this column.
  const { minEventDurationMinutes } = cfg;
  const specs = useMemo(() => {
    if (!drag) return undefined;
    const { mover, index, count } = drag;
    const step = (hourHeight * mover.snapMinutes) / 60;
    const resizeStep = (hourHeight * mover.resizeMinutes) / 60;
    const minHeight = (hourHeight * minEventDurationMinutes) / 60;
    const across = count > 1 ? colWidth : 0;
    const x = getAxisBounds(index, count, colWidth, mover.reversed);
    const gridStart = day.set({ hour: minHour });
    const gridEnd = day.plus({ hours: maxHour });
    return layouts.map((l, i): DragSpec | undefined => {
      const ev = l.event;
      // All-day events drawn in the grid (showAllDayRow={false}) move by
      // whole days only and are never resized, so they stay all-day
      // (calendar-simple).
      const allDay = isAllDayEvent(ev);
      const canMove = mover.canMove(ev);
      const canResize = !allDay && mover.canResize(ev);
      if (!canMove && !canResize) return undefined;
      const f = frames[i]!;
      const shift = (days: number, minutes: number) =>
        mover.move(ev, days, minutes);
      const stretch = (edge: ResizeEdge, minutes: number) =>
        mover.resize(ev, edge, minutes);
      const start = dateFn(ev.startDate);
      const end = ev.endDate ? dateFn(ev.endDate) : start;
      const room = Math.max(0, f.height - minHeight);
      // Focus after a keyboard move goes to one piece of a multi-day event:
      // the column of its start, or the first column when it starts earlier.
      const primary = start.hasSame(day, "day") || (index === 0 && start < day);
      return {
        focus: primary ? eventFocus(ev) : undefined,
        move: canMove
          ? {
              snapX: across,
              snapY: allDay ? 0 : step,
              bounds: {
                minX: across ? x.min : 0,
                maxX: across ? x.max : 0,
                minY: allDay ? 0 : -f.top,
                maxY: allDay ? 0 : Math.max(0, height - f.top - f.height),
              },
              drop: (dx, dy) =>
                shift(
                  cellsMoved(dx, across, mover.reversed),
                  allDay ? 0 : stepsMoved(dy, step) * mover.snapMinutes,
                ),
              shift,
              stepMinutes: allDay ? 0 : mover.snapMinutes,
              reversed: mover.reversed,
            }
          : undefined,
        resize: canResize
          ? {
              snapY: resizeStep,
              top: start >= gridStart ? { min: -f.top, max: room } : undefined,
              bottom:
                end <= gridEnd
                  ? {
                      min: -room || 0, // never -0
                      max: Math.max(0, height - f.top - f.height),
                    }
                  : undefined,
              drop: (edge, dy) =>
                stretch(edge, stepsMoved(dy, resizeStep) * mover.resizeMinutes),
              stretch,
              stepMinutes: mover.resizeMinutes,
            }
          : undefined,
      };
    });
  }, [
    drag,
    layouts,
    frames,
    colWidth,
    hourHeight,
    height,
    day,
    minHour,
    maxHour,
    minEventDurationMinutes,
  ]);

  const events = layouts.map((l, i) => {
    const base = l.event.id ?? `${l.event.startDate}-${i}`;
    return (
      <TimedEventItem
        key={`${base}-${i}`}
        event={l.event}
        frame={frames[i]!}
        testID={id(`${base}-day-event-item`)}
        drag={specs?.[i]}
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
