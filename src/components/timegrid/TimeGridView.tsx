/**
 * @file Shared frame of the Week, Day and Custom Days views: day headers, the
 * banner slot and the scrolling hour grid (port spec §4.3, TDD §8.3, §8.6).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
import type { DateType } from "../../core";
import {
  useCalendarLayout,
  useTestID,
  useViewConfig,
} from "../../context/LayoutContext";
import { useAllDayBanner } from "../../hooks/useAllDayBanner";
import { useDayEventLayout } from "../../hooks/useDayEventLayout";
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

  const { hourHeight } = metrics.timeGrid;
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
          />
        );
      })}
    </View>
  );

  return (
    <View
      testID={id(testIDSuffix)}
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
        />
      ) : null}
      <ScrollView
        ref={scrollRef}
        testID={id("time-grid-scroll")}
        onLayout={onScrollLayout}
        style={styles.root}
      >
        <View style={row}>
          <TimeColumn hourHeight={hourHeight} />
          {scrollable ? (
            <ScrollView
              ref={hscrollRef}
              testID={id("time-grid-hscroll")}
              horizontal
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
