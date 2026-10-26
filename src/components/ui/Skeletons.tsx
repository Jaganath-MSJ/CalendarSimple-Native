/**
 * @file Per-view loading skeletons (port spec §4.7). Test IDs are unprefixed,
 * as on web (port spec §9).
 */
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from "react-native";
import { useIsCurrentPage, useViewConfig } from "../../context/LayoutContext";
import type { ECalendarViewType } from "../../core";
import { useCalendarTheme } from "../../theme";
import { usePulse } from "./usePulse";

/** Skeleton fills (port spec §4.7): `[bar, base]` per scheme. */
const SKELETON_COLORS = {
  light: { bar: "#e0e0e0", base: "#f0f0f0" },
  dark: { bar: "rgba(255,255,255,0.10)", base: "rgba(255,255,255,0.06)" },
} as const;

const COLS = 7;
const ROWS = 5;
const TIME_SLOTS = 8;
const EVENT_BARS: {
  top: DimensionValue;
  left: DimensionValue;
  width: DimensionValue;
}[] = [
  { top: "15%", left: "5%", width: "45%" },
  { top: "38%", left: "52%", width: "30%" },
  { top: "62%", left: "15%", width: "55%" },
];
const SCHEDULE_ROWS = 4;
/** Month row height, port spec §4.7. */
const MONTH_ROW_HEIGHT = 100;
/** Month header row height, port spec §4.7. */
const MONTH_HEADER_HEIGHT = 40;

function useSkeleton() {
  const { scheme, metrics } = useCalendarTheme();
  const { messages } = useViewConfig();
  const colors = SKELETON_COLORS[scheme];
  // Unprefixed web IDs (port spec §9) stay unique: neighbour pages omit them,
  // and are hidden from screen readers and static.
  const current = useIsCurrentPage();
  const opacity = usePulse(current);
  const id = (testID: string) => (current ? testID : undefined);
  const bar = (style: ViewStyle, testID?: string, key?: number) => (
    <View
      key={key}
      testID={testID && id(testID)}
      style={[styles.bar, { backgroundColor: colors.bar }, style]}
    />
  );
  const container = { opacity, backgroundColor: colors.base };
  const a11y = current
    ? {
        accessible: true,
        accessibilityLabel: messages.loading,
        accessibilityState: { busy: true },
      }
    : {
        accessible: false,
        importantForAccessibility: "no-hide-descendants" as const,
        accessibilityElementsHidden: true,
      };
  return { metrics, bar, container, id, a11y };
}

/** Month: a 7 × 5 grid under a header row (also the fallback skeleton). */
export function MonthSkeleton() {
  const { bar, container, id, a11y } = useSkeleton();
  return (
    <Animated.View
      testID={id("month-skeleton")}
      {...a11y}
      style={[styles.fill, container]}
    >
      <View style={[styles.row, { height: MONTH_HEADER_HEIGHT }]}>
        {Array.from({ length: COLS }, (_, col) => (
          <View key={col} style={styles.headerCell}>
            {bar({ width: 20, height: 14 })}
          </View>
        ))}
      </View>
      {Array.from({ length: ROWS }, (_, row) => (
        <View key={row} style={[styles.row, { height: MONTH_ROW_HEIGHT }]}>
          {Array.from({ length: COLS }, (_, col) => (
            <View key={col} style={styles.cell}>
              {bar({ width: 20, height: 14 })}
              {bar({ width: "80%", height: 16 })}
              {(row + col) % 3 !== 0 ? bar({ width: "60%", height: 16 }) : null}
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

/** Day / Week / Custom Days: a time column and three event bars. */
export function TimeGridSkeleton() {
  const { metrics, bar, container, id, a11y } = useSkeleton();
  return (
    <Animated.View
      testID={id("time-grid-skeleton")}
      {...a11y}
      style={[styles.fill, styles.row, container]}
    >
      <View style={[styles.timeColumn, { width: metrics.timeGrid.gutter }]}>
        {Array.from({ length: TIME_SLOTS }, (_, i) =>
          bar({ width: 40, height: 12 }, "time-slot", i),
        )}
      </View>
      <View style={styles.fill}>
        {EVENT_BARS.map((pos, i) =>
          bar({ position: "absolute", height: 40, ...pos }, "event-bar", i),
        )}
      </View>
    </Animated.View>
  );
}

/** Schedule: four rows of a circle and two lines. */
export function ScheduleSkeleton() {
  const { bar, container, id, a11y } = useSkeleton();
  return (
    <Animated.View
      testID={id("schedule-skeleton")}
      {...a11y}
      style={[styles.fill, container]}
    >
      {Array.from({ length: SCHEDULE_ROWS }, (_, i) => (
        <View
          key={i}
          testID={id("schedule-skeleton-row")}
          style={styles.scheduleRow}
        >
          {bar({ width: 28, height: 28, borderRadius: 14 }, "skeleton-circle")}
          <View style={styles.lines}>
            {bar({ width: "70%", height: 14 }, "skeleton-line")}
            {bar({ width: "50%", height: 12 }, "skeleton-line")}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: "row" },
  bar: { borderRadius: 4 },
  headerCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  cell: { flex: 1, padding: 4, gap: 4 },
  timeColumn: {
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  lines: { flex: 1, gap: 6 },
});

/** The skeleton for `view` (Month is the fallback). */
export function ViewSkeleton({ view }: { view: ECalendarViewType }) {
  switch (view) {
    case "week":
    case "day":
    case "customDays":
      return <TimeGridSkeleton />;
    case "schedule":
      return <ScheduleSkeleton />;
    default:
      return <MonthSkeleton />;
  }
}
