/**
 * @file Absolute multi-day chips (compact, wide) or bars (phone) for one week
 * row, built from the cells' slot data (port spec §11.4, #10).
 */
import { StyleSheet, View } from "react-native";
import {
  cellsMoved,
  getAxisBounds,
  getDiffDays,
  stepsMoved,
  type CalendarDayInfo,
} from "../../core";
import type { EventMover } from "../../hooks/useEventMover";
import type { DragSpec } from "../drag/useDraggable";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { originalOf } from "../../hooks/useMonthGrid";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { EventChip } from "./EventChip";
import { MoreButton } from "./MoreButton";
import type { FocusAnchor } from "../ui/focusReturn";
import { MoreLabel } from "./MoreLabel";
import type { Frame } from "../ui/placePopover";
import { getCellOverflow } from "./overflow";

/** Moving chips (`draggable`): the mover and the grid it moves on. */
export interface MonthDrag<E extends CalendarEvent = CalendarEvent> {
  mover: EventMover<E>;
  matrix: CalendarDayInfo<E>[][];
  rowHeight: number;
}

export interface WeekBarsOverlayProps<E extends CalendarEvent = CalendarEvent> {
  row: CalendarDayInfo<E>[];
  rowIndex?: number;
  drag?: MonthDrag<E>;
  cellWidth: number;
  gutter: number;
  variant: "chip" | "bar";
  maxSlots: number;
  /** "+ N more" pressed (chip variant). */
  onMorePress?: (
    day: CalendarDayInfo<E>,
    measure: (cb: (frame: Frame) => void) => void,
    anchor: FocusAnchor,
  ) => void;
}

/**
 * A chip moves by whole cells (days) and rows (weeks) inside the grid; the
 * drop lands on the cell under the chip's start.
 */
function chipDrag<E extends CalendarEvent>(
  { mover, matrix, rowHeight }: MonthDrag<E>,
  row: CalendarDayInfo<E>[],
  rowIndex: number,
  col: number,
  cellWidth: number,
  event: E,
): DragSpec {
  const x = getAxisBounds(col, row.length, cellWidth, mover.reversed);
  const y = getAxisBounds(rowIndex, matrix.length, rowHeight);
  const from = row[col]?.currentDate;
  const shift = (days: number, minutes: number) =>
    mover.move(event, days, minutes);
  return {
    move: {
      snapX: cellWidth,
      snapY: rowHeight,
      bounds: { minX: x.min, maxX: x.max, minY: y.min, maxY: y.max },
      drop: (dx, dy) => {
        const target =
          matrix[rowIndex + stepsMoved(dy, rowHeight)]?.[
            col + cellsMoved(dx, cellWidth, mover.reversed)
          ];
        if (!target || !from) return;
        shift(Math.round(target.currentDate.diff(from, "days").days), 0);
      },
      shift,
      stepMinutes: 0,
    },
  };
}

/** Top of the first slot: the date label plus 8 px. */
export function slotTop(labelSize: number): number {
  return labelSize + 8;
}

export function WeekBarsOverlay<E extends CalendarEvent = CalendarEvent>({
  row,
  rowIndex = 0,
  drag,
  cellWidth,
  gutter,
  variant,
  maxSlots,
  onMorePress,
}: WeekBarsOverlayProps<E>) {
  const cfg = useViewConfig<E>();
  const { metrics } = useCalendarTheme();
  const id = useTestID();
  const { labelSize, chipHeight, barHeight } = metrics.month;
  const height = variant === "chip" ? chipHeight : barHeight;
  const labelArea = slotTop(labelSize);

  const chips = row.flatMap((day, col) => {
    if (!day.isCurrentMonth && !cfg.showAdjacentMonths) return [];
    return day.events.slice(0, maxSlots).flatMap((entry, slot) => {
      if (!entry || entry.isSpacer) return [];
      const span = entry.endDateWeek
        ? getDiffDays(entry.endDateWeek, entry.startDateWeek) + 1
        : 1;
      const event = originalOf<E>(entry);
      const key = event.id || `${event.startDate}-${slot}`;
      const spec =
        drag && variant === "chip" && drag.mover.canMove(event)
          ? chipDrag(drag, row, rowIndex, col, cellWidth, event)
          : undefined;
      return [
        <EventChip
          key={`${key}-${col}`}
          event={event}
          variant={variant}
          testID={id(`${key}-month-event-item`)}
          start={gutter + col * cellWidth + 4}
          width={span * cellWidth - 8}
          top={labelArea + slot * (height + 2)}
          height={height}
          drag={spec}
        />,
      ];
    });
  });

  const more = row.map((day, col) => {
    if (!day.isCurrentMonth && !cfg.showAdjacentMonths) return null;
    const { visibleSlots, hidden } = getCellOverflow(day, maxSlots);
    if (hidden <= 0) return null;
    const start = gutter + col * cellWidth + 4;
    const top = labelArea + visibleSlots * (height + 2);
    return variant === "bar" ? (
      <MoreLabel
        key={`more-${col}`}
        hidden={hidden}
        start={start}
        top={top}
        width={cellWidth - 8}
        testID={id(`${day.displayDay}-more-label`)}
      />
    ) : (
      <MoreButton
        key={`more-${col}`}
        hidden={hidden}
        start={start}
        top={top}
        width={cellWidth - 8}
        height={height}
        testID={id(`${day.displayDay}-more-events`)}
        onPress={(measure, anchor) => onMorePress?.(day, measure, anchor)}
      />
    );
  });

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {chips}
      {more}
    </View>
  );
}
