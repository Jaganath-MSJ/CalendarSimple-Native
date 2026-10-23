/**
 * @file Shared frame of the Week, Day and Custom Days views: day headers, the
 * banner slot and the scrolling hour grid (port spec §4.3, TDD §8.3, §8.6).
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
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
import { useDayEventLayout } from "../../hooks/useDayEventLayout";
import { useNow } from "../../hooks/useNow";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { useScreenReader } from "../../hooks/useScreenReader";
import { useCalendarTheme } from "../../theme";
import { getAutoScrollY } from "./autoScroll";
import { getColumnLayout, TIME_GUTTER } from "./columnLayout";
import { DayColumn } from "./DayColumn";
import { DayHeaderRow } from "./DayHeaderRow";
import { TimeColumn } from "./TimeColumn";

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

  // Column mode: the header follows the body's horizontal offset.
  const headerRef = useRef<ScrollViewInstance>(null);
  const onHScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      headerRef.current?.scrollTo({
        x: e.nativeEvent.contentOffset.x,
        animated: false,
      });
    },
    [],
  );

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
      {/* All-day banner slot (Phase 6). */}
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
              testID={id("time-grid-hscroll")}
              horizontal
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
