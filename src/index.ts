import { Calendar } from "./components/Calendar";

export default Calendar;
export { CalendarProvider, useCalendar } from "./context/CalendarContext";
export {
  CALENDAR_ACTIONS,
  DEFAULT_MESSAGES,
  ECalendarViewType,
  EDayType,
} from "./core";
export type {
  CalendarMessages,
  CalendarTheme,
  ColorScheme,
  ThemeScheme,
  ThemeStyle,
  WeekdayIndex,
} from "./core";
export type { CalendarPalette } from "./theme";
export type { MonthViewProps } from "./components/views/MonthView";
export type { ViewProps } from "./components/views/View";
export type {
  CalendarEvent,
  CalendarEventStyle,
  CalendarProps,
  CalendarStyleKey,
  CalendarStyles,
  RenderDateCellProps,
  RenderHeaderProps,
  SafeAreaInsets,
} from "./types";
