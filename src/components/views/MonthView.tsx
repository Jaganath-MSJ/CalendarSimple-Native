/**
 * @file Month view: measures the grid, resolves `maxEvents` and handles cell
 * presses (port spec §4.2, TDD §8.3, §9).
 */
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import {
  calculateMaxEvents,
  DATE_FORMATS,
  formatDate,
  MONTH_METRICS,
  resolveTheme,
  type CalendarDayInfo,
  type DateType,
} from "../../core";
import {
  useCalendarConfig,
  useCalendarState,
} from "../../context/CalendarContext";
import {
  useCalendarLayout,
  useTestID,
  ViewConfigProvider,
} from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import { useMonthGrid } from "../../hooks/useMonthGrid";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent, CalendarProps, CalendarStyles } from "../../types";
import { DayEventsSheet } from "../month/DayEventsSheet";
import { MonthGrid } from "../month/MonthGrid";
import { MorePopover } from "../month/MorePopover";
import { getCellOverflow } from "../month/overflow";
import type { Frame } from "../ui/placePopover";

/** Override keys accepted by `MonthView` (port spec §2.7; `styles` replaces `classNames`). */
export type MonthViewProps = Partial<
  Pick<
    CalendarProps,
    | "is12Hour"
    | "selectable"
    | "maxEvents"
    | "dayType"
    | "onDateClick"
    | "onEventClick"
    | "onEventLongPress"
    | "onMoreClick"
    | "theme"
    | "weekStartsOn"
    | "weekEndsOn"
    | "showAdjacentMonths"
    | "renderEvent"
    | "renderDateCell"
    | "enableEnrichedEvents"
    | "enrichedEventsByDate"
    | "eventsAreSorted"
    | "isEventOrderingEnabled"
    | "sortedMonthView"
    | "showWeekNumbers"
    | "creatable"
    | "onSlotClick"
    | "slotPressMode"
    | "showMorePopover"
  >
> & {
  styles?: CalendarStyles;
  /** Internal: the month a pager page shows (default `state.selectedDate`). */
  date?: DateType;
};

export function MonthView({ date, ...local }: MonthViewProps) {
  const cfg = useCalendarProps(local);
  const { state, dispatch } = useCalendarState();
  const { metrics, breakpoint } = useCalendarTheme();
  const layout = useCalendarLayout();
  const id = useTestID();
  const { colorScheme } = useCalendarConfig();
  const shown = date ?? state.selectedDate;
  const resolved = useMemo(
    () => resolveTheme(cfg.theme, colorScheme),
    [cfg.theme, colorScheme],
  );
  const matrix = useMonthGrid(shown, cfg.events, cfg);

  const [own, setOwn] = useState<{ width: number; height: number } | null>(
    null,
  );
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setOwn((prev) =>
      prev && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    );
  }, []);

  const phone = breakpoint === "phone";
  const width = own?.width ?? layout.width;
  const bodyHeight =
    own?.height ??
    layout.height - (layout.headerHeight ?? metrics.header.height);
  const gridHeight = bodyHeight - metrics.month.headerRowHeight;
  const rows = matrix.length || 4;
  const columns = matrix[0]?.length ?? 7;
  const gutter = cfg.showWeekNumbers ? metrics.month.weekNumberWidth : 0;
  const cellWidth = (width - gutter) / columns;
  const rowHeight = gridHeight > 0 ? gridHeight / rows : 0;
  const maxSlots =
    cfg.maxEvents ??
    calculateMaxEvents(
      Math.max(0, gridHeight),
      rows,
      phone ? MONTH_METRICS.phone : MONTH_METRICS.web,
    );

  const { selectable, creatable, onDateClick, onSlotClick, slotPressMode } =
    cfg;
  const selectedDate = state.selectedDate;

  const isSelected = useCallback(
    (info: CalendarDayInfo<CalendarEvent>) =>
      selectable &&
      info.isCurrentMonth &&
      info.currentDate.hasSame(selectedDate, "day"),
    [selectable, selectedDate],
  );

  const createAt = useCallback(
    (day: DateType) =>
      onSlotClick?.(day.startOf("day").toJSDate(), day.endOf("day").toJSDate()),
    [onSlotClick],
  );

  const [sheetDay, setSheetDay] = useState<DateType | null>(null);
  const closeSheet = useCallback(() => setSheetDay(null), []);

  const onCellPress = useCallback(
    (info: CalendarDayInfo<CalendarEvent>) => {
      const day = info.currentDate;
      if (selectable && !day.hasSame(selectedDate, "day")) {
        onDateClick?.(day.toJSDate());
        dispatch({ type: "SET_DATE", payload: day });
      }
      // Option A (phone): a day with events opens the day sheet.
      if (phone && info.totalEvents > 0) {
        setSheetDay(day);
        return;
      }
      if (creatable && slotPressMode === "press") createAt(day);
    },
    [
      selectable,
      selectedDate,
      onDateClick,
      dispatch,
      creatable,
      slotPressMode,
      createAt,
      phone,
    ],
  );

  // slotPressMode "longPress": creation moves to the cell's long press (TDD §8.7).
  const onCellLongPress = useCallback(
    (info: CalendarDayInfo<CalendarEvent>) => {
      if (creatable) createAt(info.currentDate);
    },
    [creatable, createAt],
  );

  const [popover, setPopover] = useState<{
    day: CalendarDayInfo<CalendarEvent>;
    anchor: Frame | null;
  } | null>(null);
  const { onMoreClick, showMorePopover } = cfg;
  const onMorePress = useCallback(
    (
      day: CalendarDayInfo<CalendarEvent>,
      measure: (cb: (frame: Frame) => void) => void,
    ) => {
      onMoreClick?.(
        day.currentDate.toJSDate(),
        getCellOverflow(day, maxSlots).hiddenEvents,
      );
      if (!showMorePopover) return;
      setPopover({ day, anchor: null });
      measure((anchor) =>
        setPopover((p) => (p && p.day === day ? { ...p, anchor } : p)),
      );
    },
    [onMoreClick, showMorePopover, maxSlots],
  );
  const closePopover = useCallback(() => setPopover(null), []);

  return (
    <ViewConfigProvider value={cfg}>
      <View
        testID={id("month-view")}
        accessibilityLabel={formatDate(
          shown,
          DATE_FORMATS.MONTH_YEAR,
          cfg.locale,
        )}
        onLayout={onLayout}
        style={[styles.root, cfg.styles.table]}
      >
        {width > 0 ? (
          <MonthGrid
            matrix={matrix}
            rowProps={{
              cellWidth,
              height: rowHeight,
              gutter,
              variant: phone ? "bar" : "chip",
              maxSlots,
              isSelected,
              onCellPress,
              onCellLongPress:
                slotPressMode === "longPress" ? onCellLongPress : undefined,
              onMorePress,
              resolved,
            }}
          />
        ) : null}
        <DayEventsSheet
          day={sheetDay}
          events={cfg.events}
          onClose={closeSheet}
        />
        <MorePopover
          day={popover?.day ?? null}
          anchor={popover?.anchor ?? null}
          onClose={closePopover}
        />
      </View>
    </ViewConfigProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
