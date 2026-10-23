/**
 * @file All-day banner above the time grid: GMT label, expand chevron,
 * stacked all-day and multi-day chips and "+N" chips (port spec §4.4,
 * TDD §8.3).
 */
import type { RefObject } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from "react-native";
import {
  ECalendarViewType,
  generateTooltipText,
  getGmtOffset,
  type BannerLayout,
  type DateType,
} from "../../core";
import { useTestID, useViewConfig } from "../../context/LayoutContext";
import { useCalendarTheme } from "../../theme";
import type { CalendarEvent } from "../../types";
import { pickEventStyle } from "../eventStyle";
import { ARROW, ArrowChip, CLIPPED_PADDING } from "../ui/ArrowChip";
import { TIME_GUTTER } from "./columnLayout";
import { CalendarText } from "../ui/CalendarText";
import { CalendarPressable } from "../ui/CalendarPressable";

const PADDING = 4;
const CHEVRON = 24;
/** Room for the GMT label above the 36 px chevron touch area. */
const MIN_HEIGHT_WITH_TOGGLE = 56;
/** Toggle: 44 x 36 drawn, 6 px vertical slop reaches 48. */
const TOGGLE_SLOP = { top: 6, bottom: 6, left: 2, right: 2 };
/**
 * "+N" chips sit 4 px apart in a 24 px row, so their slop is capped at 2 to
 * keep neighbours from overlapping: an exception to the 44/48 rule; the
 * chevron is the full-size target for the same action.
 */
const MORE_SLOP = 2;

export interface AllDayBannerProps<E extends CalendarEvent = CalendarEvent> {
  days: DateType[];
  colWidth: number;
  /** Fixed-width column mode: the body scrolls with the grid (via `ref`). */
  scrollable: boolean;
  expanded: boolean;
  onToggle: () => void;
  banner: BannerLayout<E>;
  /** The body's horizontal ScrollView in column mode (synced by the grid). */
  scrollRef?: RefObject<ScrollViewInstance | null>;
}

/** Banner height for the layout, in scaled metrics (port spec §4.4). */
export function bannerHeight(
  b: Pick<
    BannerLayout<CalendarEvent>,
    "rowCount" | "effectiveMaxRows" | "hasHiddenEvents"
  >,
  expanded: boolean,
  rowHeight: number,
  minHeight: number,
): number {
  const rows = expanded
    ? b.rowCount
    : b.hasHiddenEvents
      ? b.effectiveMaxRows + 1
      : b.rowCount;
  return Math.max(rows * rowHeight + 4, minHeight);
}

export function AllDayBanner<E extends CalendarEvent = CalendarEvent>({
  days,
  colWidth,
  scrollable,
  expanded,
  onToggle,
  banner,
  scrollRef,
}: AllDayBannerProps<E>) {
  const cfg = useViewConfig<E>();
  const { palette, metrics, flip } = useCalendarTheme();
  const id = useTestID();
  const { messages, renderEvent, onEventClick, onEventLongPress } = cfg;
  const { chipHeight, rowHeight, fontSize, gmtFontSize, minHeight } =
    metrics.banner;
  const height = Math.max(
    bannerHeight(banner, expanded, rowHeight, minHeight),
    banner.showExpandCollapse ? MIN_HEIGHT_WITH_TOGGLE : 0,
  );
  const width = colWidth * days.length;
  const side = flip ? "right" : "left";

  const dividers = days.map((d, i) => (
    <View
      key={d.toISODate()}
      style={[
        styles.divider,
        {
          [side]: i * colWidth,
          width: colWidth,
          borderStartColor: palette.border,
        },
      ]}
    />
  ));

  const chips = banner.visibleLayoutEvents.map((l, i) => {
    const { event } = l;
    const colours = pickEventStyle(event.style, palette.eventDefault);
    const tooltip = generateTooltipText(
      event,
      ECalendarViewType.week,
      cfg.is12Hour,
      cfg.locale,
    );
    // ArrowChip's "start"/"end" are logical; the layout's left/right are
    // in day order, so they match start/end in both directions.
    const clipStart = l.isClippedLeft;
    const clipEnd = l.isClippedRight;
    const left = l.startIndex * colWidth + 2 + (clipStart ? ARROW : 0);
    const chipWidth =
      (l.endIndex - l.startIndex + 1) * colWidth -
      4 -
      (clipStart ? ARROW : 0) -
      (clipEnd ? ARROW : 0);
    const inner =
      chipWidth -
      (clipStart ? CLIPPED_PADDING : PADDING) -
      (clipEnd ? CLIPPED_PADDING : PADDING);
    const title = event.title || messages.noTitle;
    return (
      <ArrowChip
        key={`${event.id ?? event.startDate}-${i}`}
        testID={id(`${event.id ?? `${event.startDate}-${i}`}-all-day-event`)}
        clippedStart={clipStart}
        clippedEnd={clipEnd}
        backgroundColor={colours.backgroundColor}
        height={chipHeight}
        accessibilityLabel={`${title}, ${tooltip}`}
        onPress={() => onEventClick?.(event)}
        onLongPress={() => onEventLongPress?.(event)}
        delayLongPress={500}
        style={[
          styles.chip,
          {
            top: l.row * rowHeight + 2,
            [side]: left,
            width: Math.max(0, chipWidth),
            height: chipHeight,
            marginLeft: 0,
            marginRight: 0,
            [flip ? "paddingRight" : "paddingLeft"]: clipStart
              ? CLIPPED_PADDING
              : PADDING,
            [flip ? "paddingLeft" : "paddingRight"]: clipEnd
              ? CLIPPED_PADDING
              : PADDING,
          },
          cfg.styles.event,
        ]}
      >
        {renderEvent ? (
          renderEvent(event)
        ) : // Below ~2 characters of room only fragments would show, so no text.
        inner >= fontSize * 2 ? (
          <CalendarText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.text, { color: colours.color, fontSize }]}
          >
            {title}
          </CalendarText>
        ) : null}
      </ArrowChip>
    );
  });

  const more = expanded
    ? null
    : banner.hiddenCounts.map((n, col) =>
        n > 0 ? (
          <CalendarPressable
            key={col}
            testID={id(`${col}-all-day-more-chip`)}
            accessibilityRole="button"
            accessibilityLabel={messages.moreAllDay(n)}
            onPress={onToggle}
            hitSlop={MORE_SLOP}
            style={[
              styles.more,
              {
                top: banner.effectiveMaxRows * rowHeight + 2,
                [side]: col * colWidth + 2,
                width: colWidth - 4,
                height: chipHeight,
              },
            ]}
          >
            <CalendarText
              numberOfLines={1}
              style={[
                styles.moreText,
                { color: palette.textSecondary, fontSize },
                cfg.styles.moreLabel,
              ]}
            >
              {colWidth < 90 ? `+${n}` : messages.more(n)}
            </CalendarText>
          </CalendarPressable>
        ) : null,
      );

  const body = (
    <View style={{ width, height }}>
      {dividers}
      {chips}
      {more}
    </View>
  );

  return (
    <View
      testID={id("all-day-banner")}
      role="region"
      accessibilityLabel={messages.allDayEvents}
      style={[
        flip ? styles.rowFlipped : styles.row,
        styles.banner,
        { height, borderBottomColor: palette.border },
      ]}
    >
      <View style={styles.gutter}>
        <CalendarText
          style={[
            styles.gmt,
            { color: palette.textSecondary, fontSize: gmtFontSize },
          ]}
        >
          {getGmtOffset()}
        </CalendarText>
        {banner.showExpandCollapse ? (
          <CalendarPressable
            testID={id("all-day-expand-icon")}
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? messages.collapseAllDay : messages.expandAllDay
            }
            accessibilityState={{ expanded }}
            onPress={onToggle}
            hitSlop={TOGGLE_SLOP}
            style={styles.toggle}
          >
            <View
              style={[
                styles.chevron,
                {
                  borderColor: palette.border,
                  transform: [{ rotate: expanded ? "180deg" : "0deg" }],
                },
              ]}
            >
              <View
                style={[
                  styles.chevronMark,
                  { borderColor: palette.textSecondary },
                ]}
              />
            </View>
          </CalendarPressable>
        ) : null}
      </View>
      {scrollable ? (
        <ScrollView
          ref={scrollRef}
          testID={id("all-day-banner-scroll")}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  rowFlipped: { flexDirection: "row-reverse" },
  banner: { borderBottomWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  gutter: { width: TIME_GUTTER, alignItems: "center", paddingTop: 4 },
  gmt: { fontWeight: "500" },
  toggle: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    width: CHEVRON,
    height: CHEVRON,
    borderRadius: CHEVRON / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronMark: {
    width: 7,
    height: 7,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    marginTop: -3,
    transform: [{ rotate: "45deg" }],
  },
  divider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderStartWidth: StyleSheet.hairlineWidth,
  },
  chip: { position: "absolute" },
  text: { fontWeight: "500" },
  more: {
    position: "absolute",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  moreText: { fontWeight: "500" },
});
