/**
 * @file Absolute multi-day chips (compact, wide) or bars (phone) for one week
 * row, built from the cells' slot data (port spec §11.4, #10).
 */
import { StyleSheet, View } from "react-native";
import { getDiffDays, type CalendarDayInfo } from "../../core";
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

export interface WeekBarsOverlayProps<E extends CalendarEvent = CalendarEvent> {
  row: CalendarDayInfo<E>[];
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

/** Top of the first slot: the date label plus 8 px. */
export function slotTop(labelSize: number): number {
  return labelSize + 8;
}

export function WeekBarsOverlay<E extends CalendarEvent = CalendarEvent>({
  row,
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
