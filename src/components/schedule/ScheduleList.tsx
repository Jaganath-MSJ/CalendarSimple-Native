/**
 * @file The schedule list: one section per day in the window, rows per event,
 * separators between sections, empty state, scroll-to-top on navigation,
 * pull-to-refresh and end reached (port spec §4.5, TDD §6.3).
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
  type SectionListData,
} from "react-native";
import {
  CALENDAR_ACTIONS,
  ECalendarViewType,
  getVisibleRange,
  type DateType,
} from "../../core";
import { useCalendarState } from "../../context/CalendarContext";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useToday } from "../../hooks/useNow";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { useScheduleGroups } from "../../hooks/useScheduleGroups";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { ScheduleRow } from "./ScheduleRow";
import { CalendarText } from "../ui/CalendarText";

interface Section<E> {
  dateKey: string;
  date: DateType;
  index: number;
  data: E[];
}

const RETRY_MS = 100;

export function ScheduleList<E extends CalendarEvent = CalendarEvent>() {
  const cfg = useViewConfig<E>();
  const { state, dispatch } = useCalendarState();
  const { palette, metrics } = useCalendarTheme();
  const id = useTestID();
  const reduceMotion = useReduceMotion();
  const today = useToday();
  const groups = useScheduleGroups(cfg.events, state, cfg);
  const { renderEvent, renderScheduleSeparator, messages } = cfg;
  // Circle + sub-info line + padding (metrics are already font-scaled).
  const { circle, timeFontSize } = metrics.schedule;
  const rowHeight = Math.max(
    Math.ceil(circle + timeFontSize * 1.5 + 14),
    metrics.touchTarget,
  );

  const sections = useMemo<Section<E>[]>(
    () =>
      groups.map((g, index) => ({
        dateKey: g.dateKey,
        date: g.date,
        index,
        data: g.events,
      })),
    [groups],
  );

  // Fixed rows (no renderEvent / separators): flat index = header, rows, footer per section.
  const getItemLayout = useMemo(() => {
    if (renderEvent || renderScheduleSeparator) return undefined;
    const offsets: { length: number; offset: number }[] = [];
    let offset = 0;
    for (const s of sections) {
      offsets.push({ length: 0, offset });
      for (let i = 0; i < s.data.length; i++) {
        offsets.push({ length: rowHeight, offset });
        offset += rowHeight;
      }
      offsets.push({ length: 0, offset });
    }
    return (_: unknown, index: number) => ({
      ...(offsets[index] ?? { length: 0, offset }),
      index,
    });
  }, [sections, renderEvent, renderScheduleSeparator, rowHeight]);

  // P7.S2: back to the top whenever the window moves.
  const listRef = useRef<SectionList<E, Section<E>>>(null);
  const dateKey = state.selectedDate.toISODate();
  const firstRun = useRef(true);
  const scrollTop = useCallback(() => {
    if (!sections.length) return;
    try {
      listRef.current?.scrollToLocation({
        sectionIndex: 0,
        itemIndex: 0,
        viewOffset: 0,
        animated: !reduceMotion,
      });
    } catch {
      // Not laid out yet; the next navigation scrolls again.
    }
  }, [sections.length, reduceMotion]);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    scrollTop();
    // Keyed on the date only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);
  const retried = useRef(false);
  const onScrollToIndexFailed = useCallback(() => {
    if (retried.current) return;
    retried.current = true;
    setTimeout(() => {
      scrollTop();
      retried.current = false;
    }, RETRY_MS);
  }, [scrollTop]);

  // P7.S3: extend once per window end. `extendedFrom` holds the window end
  // the last EXTEND_SCHEDULE grew from (read synchronously, so back-to-back
  // events before a re-render cannot both extend). Once extended, the list
  // must scroll (or navigate) before the next end reached counts: React
  // re-renders between two events, and VirtualizedList re-fires only after
  // the user moves. Empty extensions never stall: each scroll re-arms.
  const rangeEnd = getVisibleRange(
    ECalendarViewType.schedule,
    state.selectedDate,
    {
      weekStartsOn: cfg.weekStartsOn,
      weekEndsOn: cfg.weekEndsOn,
      customDays: state.customDays,
      scheduleDays: cfg.scheduleDays,
      scheduleExtraDays: state.scheduleExtraDays,
    },
  ).end.toISODate();
  const extendedFrom = useRef<string | null>(null);
  const armed = useRef(true);
  useEffect(() => {
    armed.current = true;
    extendedFrom.current = null;
  }, [dateKey]);
  const onScroll = useCallback(() => {
    armed.current = true;
  }, []);
  const { scheduleDays, onEndReached } = cfg;
  const handleEndReached = useCallback(() => {
    if (!armed.current || extendedFrom.current === rangeEnd) return;
    armed.current = false;
    extendedFrom.current = rangeEnd;
    dispatch({ type: CALENDAR_ACTIONS.EXTEND_SCHEDULE, payload: scheduleDays });
    onEndReached?.();
  }, [rangeEnd, dispatch, scheduleDays, onEndReached]);

  const last = sections.length - 1;
  const separated = renderScheduleSeparator !== undefined;

  return (
    <SectionList<E, Section<E>>
      ref={listRef}
      testID={id("schedule-view")}
      style={[styles.list, { backgroundColor: palette.bg }]}
      sections={sections}
      stickySectionHeadersEnabled={false}
      keyExtractor={(e, i) => `${e.id ?? e.startDate}-${i}`}
      getItemLayout={getItemLayout}
      onScrollToIndexFailed={onScrollToIndexFailed}
      renderItem={({ item, index, section }) => (
        <ScheduleRow
          event={item}
          day={section.date}
          dateKey={section.dateKey}
          first={index === 0}
          last={index === section.data.length - 1}
          separated={separated}
          isToday={section.dateKey === today}
          height={rowHeight}
        />
      )}
      renderSectionFooter={({
        section,
      }: {
        section: SectionListData<E, Section<E>>;
      }) =>
        renderScheduleSeparator && section.index < last ? (
          <View>{renderScheduleSeparator(section.date.toJSDate())}</View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <CalendarText style={{ color: palette.textSecondary }}>
            {messages.noEvents}
          </CalendarText>
        </View>
      }
      refreshControl={
        cfg.onRefresh ? (
          <RefreshControl
            refreshing={cfg.refreshing}
            onRefresh={cfg.onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        ) : undefined
      }
      onEndReachedThreshold={0.5}
      onEndReached={handleEndReached}
      onScroll={onScroll}
      scrollEventThrottle={100}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  empty: { padding: 24, alignItems: "center" },
});
