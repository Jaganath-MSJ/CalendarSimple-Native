/**
 * @file Shared frame of the Week, Day and Custom Days views: day headers, the
 * banner slot and the scrolling hour grid (port spec §4.3, TDD §8.3, §8.6).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import { ECalendarViewType, type DateType } from "../../core";
import {
  useDragState,
  useGestureAdapter,
  useZoomState,
} from "../../context/GestureAdapterContext";
import {
  useCalendarLayout,
  useIsCurrentPage,
  useTestID,
  useViewConfig,
} from "../../context/LayoutContext";
import { useAllDayBanner } from "../../hooks/useAllDayBanner";
import { useDayEventLayout } from "../../hooks/useDayEventLayout";
import { useEventMover } from "../../hooks/useEventMover";
import { usePeriodKeys } from "../../hooks/useKeyboardNavigation";
import { useNow } from "../../hooks/useNow";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { useScreenReader } from "../../hooks/useScreenReader";
import { useCalendarTheme } from "../../theme";
import { AllDayBanner } from "./AllDayBanner";
import { getAutoScrollY } from "./autoScroll";
import { getColumnLayout, TIME_GUTTER } from "./columnLayout";
import { DayColumn } from "./DayColumn";
import { DayHeaderRow } from "./DayHeaderRow";
import { TimeColumn } from "./TimeColumn";
import { useAppIsRTL } from "../../hooks/useAppIsRTL";

/** Skips the banner layout when the banner is off. */
const NO_DAYS: DateType[] = [];

const VIEW_OF = {
  week: ECalendarViewType.week,
  day: ECalendarViewType.day,
  custom: ECalendarViewType.customDays,
} as const;

export interface TimeGridViewProps {
  days: DateType[];
  variant: "week" | "day" | "custom";
  testIDSuffix: "week-view" | "day-view" | "custom-days-view";
}

export function TimeGridView({
  days,
  variant,
  testIDSuffix,
}: TimeGridViewProps) {
  const cfg = useViewConfig();
  const { palette, metrics, breakpoint, flip } = useCalendarTheme();
  const layout = useCalendarLayout();
  const id = useTestID();
  const reduceMotion = useReduceMotion();
  const screenReader = useScreenReader();
  const now = useNow();
  const today = now.toISODate() ?? "";
  const onKeyDown = usePeriodKeys(cfg.keyboardNavigation, { arrows: true });
  // Moving events: one stable drag object per column; scrolling pauses
  // while an event is dragged.
  const mover = useEventMover(cfg, VIEW_OF[variant]);
  const columnDrag = useMemo(
    () =>
      mover
        ? days.map((_, index) => ({ mover, index, count: days.length }))
        : undefined,
    [mover, days],
  );
  const { dragging, setDragging } = useDragState();

  // Hour height: the prop (controlled), else the pinched value shared by
  // every page, else the theme's.
  const zoom = useZoomState();
  const hourHeight =
    cfg.hourHeight ?? zoom.hourHeight ?? metrics.timeGrid.hourHeight;
  const { minHour, maxHour, showCurrentTime, autoScrollToCurrentTime } = cfg;
  const { colWidth, scrollable, snap } = getColumnLayout({
    width: layout.width,
    days: days.length,
    swipe: cfg.swipeNavigation,
    breakpoint,
  });
  const layouts = useDayEventLayout(cfg.events, days, cfg);

  const nowMinutes = now.hour * 60 + now.minute;
  const nowVisible =
    showCurrentTime && nowMinutes >= minHour * 60 && nowMinutes < maxHour * 60;
  const nowTop = ((nowMinutes - minHour * 60) * hourHeight) / 60;

  // Auto-scroll (#5): on layout and whenever the visible days change.
  const scrollRef = useRef<ScrollViewInstance>(null);
  const viewport = useRef(0);
  const daysKey = `${days[0]?.toISODate() ?? ""}|${days.length}`;
  const showsToday = days.some((d) => d.toISODate() === today);
  const scrollToNow = useCallback(() => {
    if (!autoScrollToCurrentTime || !showsToday || viewport.current <= 0)
      return;
    scrollRef.current?.scrollTo({
      y: getAutoScrollY({
        nowMinutes,
        minHour,
        hourHeight,
        viewportHeight: viewport.current,
      }),
      animated: !reduceMotion,
    });
  }, [
    autoScrollToCurrentTime,
    showsToday,
    nowMinutes,
    minHour,
    hourHeight,
    reduceMotion,
  ]);
  const scrollToNowRef = useRef(scrollToNow);
  useLayoutEffect(() => {
    scrollToNowRef.current = scrollToNow;
  }, [scrollToNow]);
  useEffect(() => {
    scrollToNowRef.current();
  }, [daysKey]);
  const onScrollLayout = useCallback((e: LayoutChangeEvent) => {
    const first = viewport.current === 0;
    viewport.current = e.nativeEvent.layout.height;
    if (first) scrollToNowRef.current();
  }, []);

  // All-day banner: collapsed again whenever the visible days change.
  const [expanded, setExpanded] = useState(false);
  const [expandedKey, setExpandedKey] = useState(daysKey);
  if (expandedKey !== daysKey) {
    setExpandedKey(daysKey);
    setExpanded(false);
  }
  const onToggleBanner = useCallback(() => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded((v) => !v);
  }, [reduceMotion]);
  const banner = useAllDayBanner(
    cfg.showAllDayRow ? days : NO_DAYS,
    cfg.events,
    expanded,
    cfg.maxEvents,
  );

  // Column mode: the header and banner follow the body's horizontal offset.
  const headerRef = useRef<ScrollViewInstance>(null);
  const bannerRef = useRef<ScrollViewInstance>(null);
  const onHScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      headerRef.current?.scrollTo({ x, animated: false });
      bannerRef.current?.scrollTo({ x, animated: false });
    },
    [],
  );

  // Flipped in an LTR app, the reversed row puts the first day at the far
  // end of the content, so start there (header and banner follow).
  // Scroll offsets stay physical, so the onScroll sync above holds in RTL.
  const hscrollRef = useRef<ScrollViewInstance>(null);
  const appIsRTL = useAppIsRTL();
  const startAtEnd = flip && !appIsRTL;
  const onHContentSize = useCallback(() => {
    if (!startAtEnd) return;
    for (const r of [hscrollRef, headerRef, bannerRef])
      r.current?.scrollToEnd({ animated: false });
  }, [startAtEnd]);

  // Pinch to zoom: the wrapper scales the content during the pinch; on
  // release the new height is committed once and the scroll offset moves so
  // the hour under the fingers stays put.
  const { TimeGridWrapper } = useGestureAdapter();
  const current = useIsCurrentPage();
  const Pinch = cfg.pinchToZoom && current ? TimeGridWrapper : undefined;
  const scrollY = useRef(0);
  const onVScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );
  const pendingFocus = useRef<{ y: number; from: number } | null>(null);
  const { onHourHeightChange } = cfg;
  const controlled = cfg.hourHeight !== undefined;
  const { setHourHeight } = zoom;
  const onZoomStart = useCallback(() => setDragging(true), [setDragging]);
  const onZoomEnd = useCallback(
    (next: number, focalY: number) => {
      setDragging(false);
      if (next === hourHeight) return;
      pendingFocus.current = { y: focalY, from: hourHeight };
      if (!controlled) setHourHeight(next);
      onHourHeightChange?.(next);
    },
    [setDragging, hourHeight, controlled, setHourHeight, onHourHeightChange],
  );
  useLayoutEffect(() => {
    const focus = pendingFocus.current;
    if (!focus || focus.from === hourHeight) return;
    pendingFocus.current = null;
    const y = scrollY.current + focus.y * (hourHeight / focus.from - 1);
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false });
  }, [hourHeight]);

  const row = flip ? styles.rowFlipped : styles.row;
  const header = (
    <DayHeaderRow
      days={days}
      variant={variant}
      colWidth={colWidth}
      today={today}
    />
  );
  const columns = (
    <View style={row}>
      {days.map((d, i) => {
        const iso = d.toISODate();
        return (
          <DayColumn
            key={iso}
            date={d}
            layouts={layouts[i] ?? []}
            colWidth={colWidth}
            hourHeight={hourHeight}
            nowTop={nowVisible && iso === today ? nowTop : null}
            screenReader={screenReader}
            drag={columnDrag?.[i]}
          />
        );
      })}
    </View>
  );

  const grid = (
    <View style={row}>
      <TimeColumn hourHeight={hourHeight} />
      {scrollable ? (
        <ScrollView
          ref={hscrollRef}
          testID={id("time-grid-hscroll")}
          horizontal
          scrollEnabled={!dragging}
          onContentSizeChange={onHContentSize}
          onScroll={onHScroll}
          scrollEventThrottle={16}
          snapToInterval={snap ? colWidth : undefined}
          decelerationRate={snap ? "fast" : undefined}
          showsHorizontalScrollIndicator={false}
        >
          {columns}
        </ScrollView>
      ) : (
        columns
      )}
    </View>
  );

  return (
    <View
      testID={id(testIDSuffix)}
      onKeyDown={onKeyDown}
      tabIndex={onKeyDown ? -1 : undefined}
      style={[styles.root, { backgroundColor: palette.bg }, cfg.styles.table]}
    >
      <View
        style={[
          row,
          styles.headerRow,
          { borderBottomColor: palette.border },
          cfg.styles.tableHeader,
        ]}
      >
        <View style={styles.gutter} />
        {scrollable ? (
          <ScrollView
            ref={headerRef}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
          >
            {header}
          </ScrollView>
        ) : (
          header
        )}
      </View>
      {cfg.showAllDayRow ? (
        <AllDayBanner
          days={days}
          colWidth={colWidth}
          scrollable={scrollable}
          expanded={expanded}
          onToggle={onToggleBanner}
          banner={banner}
          scrollRef={bannerRef}
          mover={mover}
        />
      ) : null}
      <ScrollView
        ref={scrollRef}
        testID={id("time-grid-scroll")}
        onLayout={onScrollLayout}
        scrollEnabled={!dragging}
        onScroll={onVScroll}
        scrollEventThrottle={16}
        style={styles.root}
      >
        {Pinch ? (
          <Pinch
            hourHeight={hourHeight}
            minHourHeight={cfg.minHourHeight}
            maxHourHeight={cfg.maxHourHeight}
            onZoomStart={onZoomStart}
            onZoomEnd={onZoomEnd}
          >
            {grid}
          </Pinch>
        ) : (
          grid
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: { flexDirection: "row" },
  rowFlipped: { flexDirection: "row-reverse" },
  headerRow: { borderBottomWidth: StyleSheet.hairlineWidth },
  gutter: { width: TIME_GUTTER },
});
