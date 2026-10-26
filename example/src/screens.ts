import type { ComponentType } from "react";
import FeaturesScreen from "./screens/FeaturesScreen";
import CustomizationScreen from "./screens/CustomizationScreen";
import LocalizationScreen from "./screens/LocalizationScreen";
import AccessibilityScreen from "./screens/AccessibilityScreen";
import EdgeCasesScreen from "./screens/EdgeCasesScreen";
import LayoutLimitsScreen from "./screens/LayoutLimitsScreen";
import TimeFormattingScreen from "./screens/TimeFormattingScreen";
import InteractionsScreen from "./screens/InteractionsScreen";
import PlaygroundScreen from "./screens/PlaygroundScreen";
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
  { key: "features", title: "Features", component: FeaturesScreen },
  {
    key: "customization",
    title: "Customization",
    component: CustomizationScreen,
  },
  { key: "localization", title: "Localization", component: LocalizationScreen },
  {
    key: "accessibility",
    title: "Accessibility",
    component: AccessibilityScreen,
  },
  { key: "edgeCases", title: "Edge cases", component: EdgeCasesScreen },
  {
    key: "layoutLimits",
    title: "Layout limits",
    component: LayoutLimitsScreen,
  },
  {
    key: "timeFormatting",
    title: "Time formatting",
    component: TimeFormattingScreen,
  },
  { key: "interactions", title: "Interactions", component: InteractionsScreen },
  { key: "playground", title: "Playground", component: PlaygroundScreen },
  { key: "pager", title: "Pager probe", component: PagerProbeScreen },
  { key: "perf", title: "Performance", component: PerfScreen },
];
