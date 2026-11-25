/**
 * @file The schedule list: one section per day with events (every event, as
 * calendar-simple), rows per event, separators between sections, empty
 * state, scroll to the selected date and pull-to-refresh (port spec §4.5,
 * TDD §6.3).
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
  type SectionListData,
} from "react-native";
import type { DateType } from "../../core";
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
/** Jumps near a far section before giving up (onScrollToIndexFailed). */
const MAX_RETRIES = 3;

export function ScheduleList<E extends CalendarEvent = CalendarEvent>() {
  const cfg = useViewConfig<E>();
  const { state } = useCalendarState();
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

  // The first day on or after the selected date, else the last day.
  const listRef = useRef<SectionList<E, Section<E>>>(null);
  // Retries left for the current scroll (onScrollToIndexFailed).
  const retries = useRef(0);
  const selectedKey = state.selectedDate.toISODate() ?? "";
  const targetIndex = useMemo(() => {
    if (!sections.length) return -1;
    const i = sections.findIndex((sec) => sec.dateKey >= selectedKey);
    return i === -1 ? sections.length - 1 : i;
  }, [sections, selectedKey]);
  const scrollToTarget = useCallback(
    (animated: boolean) => {
      if (targetIndex < 0) return;
      try {
        listRef.current?.scrollToLocation({
          sectionIndex: targetIndex,
          itemIndex: 0,
          viewOffset: 0,
          animated,
        });
      } catch {
        // Not laid out yet; onScrollToIndexFailed retries.
      }
    },
    [targetIndex],
  );
  // With autoScrollToCurrentTime: once the target day is known (on mount, or
  // when the events first arrive) and whenever it becomes a different day,
  // not on every new events array (a refresh, a parent re-render or
  // re-expanded series would pull the user back). Every Today or date pick
  // (even to the same date) scrolls through navigationId below.
  const { autoScrollToCurrentTime } = cfg;
  const targetKey = sections[targetIndex]?.dateKey;
  const scrolledKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!autoScrollToCurrentTime || !targetKey) return;
    if (scrolledKey.current === targetKey) return;
    scrolledKey.current = targetKey;
    retries.current = 0;
    scrollToTarget(false);
    // Keyed on the setting and the target day only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScrollToCurrentTime, targetKey]);
  const lastNavigation = useRef(state.navigationId);
  useEffect(() => {
    if (lastNavigation.current === state.navigationId) return;
    lastNavigation.current = state.navigationId;
    retries.current = 0;
    scrollToTarget(!reduceMotion);
    // Keyed on navigation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.navigationId]);
  // A far section is not rendered yet when rows have no fixed height
  // (renderEvent or separators): jump near it with the average row height,
  // let it render, then try again (a few times).
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      if (retries.current >= MAX_RETRIES) {
        retries.current = 0;
        return;
      }
      retries.current += 1;
      listRef.current?.getScrollResponder()?.scrollTo({
        y: info.averageItemLength * info.index,
        animated: false,
      });
      setTimeout(() => {
        scrollToTarget(false);
      }, RETRY_MS);
    },
    [scrollToTarget],
  );

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
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  empty: { padding: 24, alignItems: "center" },
});
