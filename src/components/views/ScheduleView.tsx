/**
 * @file Schedule view: the event list for the window starting at the
 * selected date (port spec §4.5, #6C).
 */
import { StyleSheet, View } from "react-native";
import { ViewConfigProvider } from "../../context/LayoutContext";
import { useCalendarProps } from "../../hooks/useCalendarProps";
import { usePeriodKeys } from "../../hooks/useKeyboardNavigation";
import type { DateType } from "../../core";
import type { CalendarProps, CalendarStyles } from "../../types";
import { ScheduleList } from "../schedule/ScheduleList";

/** The web `ScheduleViewProps` keys plus native ones (`styles` replaces `classNames`). */
export type ScheduleViewProps = Partial<
  Pick<
    CalendarProps,
    | "is12Hour"
    | "dayType"
    | "onEventClick"
    | "onEventLongPress"
    | "theme"
    | "autoScrollToCurrentTime"
    | "renderEvent"
    | "renderScheduleSeparator"
    | "scheduleDays"
    | "onRefresh"
    | "refreshing"
    | "onEndReached"
  >
> & {
  styles?: CalendarStyles;
  /** Internal: ignored (the schedule does not page). */
  date?: DateType;
};

export function ScheduleView({ date: _date, ...local }: ScheduleViewProps) {
  const cfg = useCalendarProps(local);
  // Web: PageUp / PageDown / T move the window, ↑ / ↓ move between rows.
  const onKeyDown = usePeriodKeys(cfg.keyboardNavigation, {
    arrows: false,
    rows: true,
  });
  return (
    <ViewConfigProvider value={cfg}>
      {onKeyDown ? (
        <View style={styles.fill} onKeyDown={onKeyDown} tabIndex={-1}>
          <ScheduleList />
        </View>
      ) : (
        <ScheduleList />
      )}
    </ViewConfigProvider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
