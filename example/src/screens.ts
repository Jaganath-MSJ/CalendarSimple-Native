import type { ComponentType } from "react";
import CustomDaysScreen from "./screens/CustomDaysScreen";
import DayScreen from "./screens/DayScreen";
import HeaderScreen from "./screens/HeaderScreen";
import IntlCheckScreen from "./screens/IntlCheckScreen";
import MonthScreen from "./screens/MonthScreen";
import PagerProbeScreen from "./screens/PagerProbeScreen";
import PerfScreen from "./screens/PerfScreen";
import ScheduleScreen from "./screens/ScheduleScreen";
import WeekScreen from "./screens/WeekScreen";

export const SCREENS: {
  key: string;
  title: string;
  component: ComponentType;
}[] = [
  { key: "intl", title: "Intl check", component: IntlCheckScreen },
  { key: "header", title: "Header", component: HeaderScreen },
  { key: "month", title: "Month", component: MonthScreen },
  { key: "week", title: "Week", component: WeekScreen },
  { key: "day", title: "Day", component: DayScreen },
  { key: "customDays", title: "3 Days", component: CustomDaysScreen },
  { key: "schedule", title: "Schedule", component: ScheduleScreen },
  { key: "pager", title: "Pager probe", component: PagerProbeScreen },
  { key: "perf", title: "Performance", component: PerfScreen },
];
