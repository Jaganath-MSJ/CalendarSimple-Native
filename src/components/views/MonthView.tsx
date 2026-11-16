/**
 * @file Month view: measures the grid, resolves `maxEvents` and handles cell
 * presses (port spec §4.2, TDD §8.3, §9).
 */
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import {
  calculateMaxEvents,
  dateFn,
  DATE_FORMATS,
  ECalendarViewType,
  formatDate,
  getMonthKeyTarget,
  isVisibleWeekday,
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
import {
  readKey,
  useKeyboardEnabled,
  type WebKeyEvent,
} from "../../hooks/useKeyboardNavigation";
import { useNavigate } from "../../hooks/useNavigate";
import { useEventMover } from "../../hooks/useEventMover";
import { useMonthGrid } from "../../hooks/useMonthGrid";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent, CalendarProps, CalendarStyles } from "../../types";
import { DayEventsSheet } from "../month/DayEventsSheet";
import { MonthGrid } from "../month/MonthGrid";
import { MorePopover } from "../month/MorePopover";
import { getCellOverflow } from "../month/overflow";
import type { Frame } from "../ui/placePopover";
import type { FocusAnchor } from "../ui/focusReturn";

/** Override keys accepted by `MonthView` (port spec §2.7; `styles` replaces `classNames`). */
/** Phone month shows at most 3 bars per day; the rest go in "+N". */
const PHONE_MAX_BARS = 3;

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
  const { metrics, breakpoint, flip } = useCalendarTheme();
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
    (phone
      ? Math.min(
          calculateMaxEvents(
            Math.max(0, gridHeight),
            rows,
            MONTH_METRICS.phone,
          ),
          PHONE_MAX_BARS,
        )
      : calculateMaxEvents(Math.max(0, gridHeight), rows, MONTH_METRICS.web));

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
  const [sheetAnchor, setSheetAnchor] = useState<FocusAnchor>(null);
  const closeSheet = useCallback(() => setSheetDay(null), []);

  const onCellPress = useCallback(
    (info: CalendarDayInfo<CalendarEvent>, anchor: FocusAnchor) => {
      const day = info.currentDate;
      if (selectable && !day.hasSame(selectedDate, "day")) {
        onDateClick?.(day.toJSDate());
        dispatch({ type: "SET_DATE", payload: day });
      }
      // Option A (phone): a day with events opens the day sheet.
      if (phone && info.totalEvents > 0) {
        setSheetAnchor(anchor);
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

  // Web keyboard (keyboardNavigation): one cell is the tab stop (roving
  // focus); keys move it, and leaving the month navigates.
  const keyboard = useKeyboardEnabled(cfg.keyboardNavigation);
  const navigate = useNavigate();
  const { weekStartsOn, weekEndsOn } = cfg;
  const [focusDay, setFocusDay] = useState<DateType | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const rovingDay = useMemo(() => {
    const inMonth = (d: DateType | null): d is DateType =>
      d !== null && d.hasSame(shown, "month");
    const today = dateFn();
    let day = inMonth(focusDay)
      ? focusDay
      : inMonth(selectedDate)
        ? selectedDate
        : inMonth(today)
          ? today
          : shown.startOf("month");
    for (
      let i = 0;
      i < 7 && !isVisibleWeekday(day, weekStartsOn, weekEndsOn);
      i++
    )
      day = day.plus({ days: 1 });
    return day.startOf("day");
  }, [focusDay, selectedDate, shown, weekStartsOn, weekEndsOn]);
  const onCellFocus = useCallback(
    (info: CalendarDayInfo<CalendarEvent>) => setFocusDay(info.currentDate),
    [],
  );
  // Moving chips (draggable): one stable object for every week row.
  const mover = useEventMover(cfg, ECalendarViewType.month);
  const monthDrag = useMemo(
    () => (mover ? { mover, matrix, rowHeight } : undefined),
    [mover, matrix, rowHeight],
  );

  const rovingIso = rovingDay.toISODate() ?? "";
  const gridKeyboard = useMemo(
    () =>
      keyboard
        ? { focusIso: rovingIso, focusToken, onFocus: onCellFocus }
        : undefined,
    [keyboard, rovingIso, focusToken, onCellFocus],
  );
  const onKeyDown = useCallback(
    (e: WebKeyEvent) => {
      const key = readKey(e);
      if (!key) return;
      const target = getMonthKeyTarget(key, rovingDay, {
        weekStartsOn,
        weekEndsOn,
        flip,
        today: dateFn(),
      });
      if (!target) return;
      e.preventDefault();
      setFocusDay(target);
      setFocusToken((n) => n + 1);
      if (!target.hasSame(shown, "month")) navigate(target);
    },
    [rovingDay, weekStartsOn, weekEndsOn, flip, shown, navigate],
  );

  const [popover, setPopover] = useState<{
    day: CalendarDayInfo<CalendarEvent>;
    anchor: Frame | null;
    opener: FocusAnchor;
  } | null>(null);
  const { onMoreClick, showMorePopover } = cfg;
  const onMorePress = useCallback(
    (
      day: CalendarDayInfo<CalendarEvent>,
      measure: (cb: (frame: Frame) => void) => void,
      opener: FocusAnchor,
    ) => {
      onMoreClick?.(
        day.currentDate.toJSDate(),
        getCellOverflow(day, maxSlots).hiddenEvents,
      );
      if (!showMorePopover) return;
      setPopover({ day, anchor: null, opener });
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
        onKeyDown={keyboard ? onKeyDown : undefined}
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
              keyboard: gridKeyboard,
              drag: monthDrag,
            }}
          />
        ) : null}
        <DayEventsSheet
          day={sheetDay}
          events={cfg.events}
          onClose={closeSheet}
          returnFocusTo={sheetAnchor}
        />
        <MorePopover
          day={popover?.day ?? null}
          anchor={popover?.anchor ?? null}
          onClose={closePopover}
          returnFocusTo={popover?.opener}
        />
      </View>
    </ViewConfigProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
