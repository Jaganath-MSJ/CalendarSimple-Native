/**
 * @file `Calendar.View`: renders the active view, or its loading state
 * (port spec §4.7–§4.8).
 */
import { View as RNView, StyleSheet } from "react-native";
import {
  useCalendarConfig,
  useCalendarState,
} from "../../context/CalendarContext";
import type { DateType, ECalendarViewType } from "../../core";
import type { CalendarProps } from "../../types";
import { FadeIn } from "../ui/FadeIn";
import { LoadingOverlay } from "../ui/LoadingOverlay";
import { ViewSkeleton } from "../ui/Skeletons";
import { CustomDaysView } from "./CustomDaysView";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import { ScheduleView } from "./ScheduleView";
import { WeekView } from "./WeekView";

export type ViewProps = Partial<CalendarProps> & {
  /** Internal: the period a pager page shows (default `state.selectedDate`). */
  date?: DateType;
};

export function View({ date, ...props }: ViewProps) {
  const { state } = useCalendarState();
  const { config } = useCalendarConfig();
  const isLoading = props.isLoading ?? config.isLoading;
  const events = props.events ?? config.events;
  const renderLoading = props.renderLoading ?? config.renderLoading;

  // FadeIn stays mounted across all three states so it sees loading end.
  let content;
  if (isLoading && events.length === 0) {
    content = renderLoading ? (
      <RNView style={styles.fill}>{renderLoading()}</RNView>
    ) : (
      <ViewSkeleton view={state.view} />
    );
  } else {
    const body = renderView(state.view, props, date);
    content = isLoading ? <LoadingOverlay>{body}</LoadingOverlay> : body;
  }
  return <FadeIn trigger={isLoading}>{content}</FadeIn>;
}

function renderView(
  view: ECalendarViewType,
  props: Partial<CalendarProps>,
  date: DateType | undefined,
) {
  switch (view) {
    case "month":
      return <MonthView {...props} date={date} />;
    case "week":
      return <WeekView {...props} date={date} />;
    case "day":
      return <DayView {...props} date={date} />;
    case "customDays":
      return <CustomDaysView {...props} date={date} />;
    case "schedule":
      return <ScheduleView {...props} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
