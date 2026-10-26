/**
 * @file Public prop types (TDD §6.2–§6.5).
 */
import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type {
  BaseCalendarEvent,
  CalendarMessages,
  CalendarTheme,
  ColorScheme,
  Direction,
  ECalendarViewType,
  EDayType,
  WeekdayIndex,
} from "../core";
import type { CalendarPalette } from "../theme/palette";

/** Per-event colours (#18: colour keys only). */
export interface CalendarEventStyle {
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
  opacity?: number;
}

export interface CalendarEvent extends BaseCalendarEvent {
  style?: CalendarEventStyle;
}

/** The 20 web `classNames` keys plus native-only keys (TDD §6.4). */
export type CalendarStyleKey =
  | "root"
  | "header"
  | "table"
  | "tableHeader"
  | "tableDate"
  | "weekNumber"
  | "event"
  | "selected"
  | "today"
  | "dayHeader"
  | "dayName"
  | "dayNumber"
  | "timeColumn"
  | "timeSlot"
  | "dayColumn"
  | "scheduleDateGroup"
  | "scheduleDateNumber"
  | "scheduleDateSubInfo"
  | "scheduleTime"
  | "scheduleTitle"
  | "daySheet"
  | "popover"
  | "menu"
  | "moreLabel";

/** Style overrides, applied last in each component's style array. */
export type CalendarStyles = Partial<
  Record<CalendarStyleKey, StyleProp<ViewStyle | TextStyle>>
>;

export interface RenderHeaderProps {
  /** The selected date (`state.selectedDate`), not the first visible day. */
  currentDate: Date;
  view: ECalendarViewType;
  onNavigate: (date: Date) => void;
  onViewChange: (view: ECalendarViewType) => void;
}

export interface RenderDateCellProps {
  date: Date;
  isToday: boolean;
  isSelected?: boolean;
  /** False for adjacent-month cells. */
  isCurrentMonth?: boolean;
}

export interface SafeAreaInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export type DimensionValue = number | `${number}%`;

export type SlotPressMode = "press" | "longPress";

/** Props of `<Calendar>` (TDD §6.3). */
export interface CalendarProps<TEvent extends CalendarEvent = CalendarEvent> {
  children?: ReactNode;
  // Data
  events?: TEvent[];
  selectedDate?: Date;
  view?: ECalendarViewType;
  customDays?: number;
  testID?: string;
  isLoading?: boolean;
  renderLoading?: () => ReactNode;
  // Config
  is12Hour?: boolean | "locale";
  selectable?: boolean;
  creatable?: boolean;
  slotPressMode?: SlotPressMode;
  maxEvents?: number;
  dayType?: EDayType;
  pastYearLength?: number;
  futureYearLength?: number;
  showCurrentTime?: boolean;
  autoScrollToCurrentTime?: boolean;
  minHour?: number;
  maxHour?: number;
  weekStartsOn?: WeekdayIndex | "locale";
  weekEndsOn?: WeekdayIndex;
  showAdjacentMonths?: boolean;
  showWeekNumbers?: boolean;
  resetDateOnViewChange?: boolean;
  showAllDayRow?: boolean;
  /** Percent of column width. */
  eventOverlapOffset?: number;
  scheduleDays?: number;
  swipeNavigation?: boolean;
  showMorePopover?: boolean;
  maxFontSizeMultiplier?: number;
  // Layout
  width?: DimensionValue;
  height?: DimensionValue;
  safeAreaInsets?: SafeAreaInsets;
  // Callbacks
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: TEvent) => void;
  onEventLongPress?: (event: TEvent) => void;
  onMoreClick?: (date: Date, hiddenEvents: TEvent[]) => void;
  onNavigate?: (date: Date) => void;
  onViewChange?: (view: ECalendarViewType) => void;
  onSlotClick?: (start: Date, end: Date) => void;
  onDateRangeChange?: (start: Date, end: Date, view: ECalendarViewType) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  // Appearance
  theme?: CalendarTheme;
  styles?: CalendarStyles;
  palette?: {
    light?: Partial<CalendarPalette>;
    dark?: Partial<CalendarPalette>;
  };
  colorScheme?: ColorScheme;
  direction?: Direction;
  locale?: string;
  localeMessages?: Partial<CalendarMessages>;
  // Render props
  renderEvent?: (event: TEvent) => ReactNode;
  renderHeader?: (props: RenderHeaderProps) => ReactNode;
  renderDateCell?: (props: RenderDateCellProps) => ReactNode;
  renderHourCell?: (slotStart: Date) => ReactNode;
  renderScheduleSeparator?: (date: Date) => ReactNode;
  // Performance
  eventsAreSorted?: boolean;
  enableEnrichedEvents?: boolean;
  enrichedEventsByDate?: Record<string, TEvent[]>;
  isEventOrderingEnabled?: boolean;
  sortedMonthView?: boolean | ((a: TEvent, b: TEvent) => number);
}

/** Keys that `applyDefaults` always fills. */
type DefaultedKey =
  | "events"
  | "view"
  | "locale"
  | "selectable"
  | "creatable"
  | "dayType"
  | "pastYearLength"
  | "futureYearLength"
  | "showCurrentTime"
  | "autoScrollToCurrentTime"
  | "minHour"
  | "maxHour"
  | "showAdjacentMonths"
  | "showWeekNumbers"
  | "resetDateOnViewChange"
  | "showAllDayRow"
  | "eventOverlapOffset"
  | "enableEnrichedEvents"
  | "eventsAreSorted"
  | "isEventOrderingEnabled"
  | "sortedMonthView"
  | "isLoading"
  | "theme"
  | "styles"
  | "colorScheme"
  | "safeAreaInsets"
  | "refreshing";

/** `CalendarProps` after `applyDefaults`: defaulted keys required, `"locale"` values resolved. */
export type ResolvedConfig<TEvent extends CalendarEvent = CalendarEvent> = Omit<
  CalendarProps<TEvent>,
  | DefaultedKey
  | "weekStartsOn"
  | "weekEndsOn"
  | "is12Hour"
  | "swipeNavigation"
  | "maxFontSizeMultiplier"
  | "scheduleDays"
  | "slotPressMode"
  | "showMorePopover"
  | "testID"
> &
  Required<Pick<CalendarProps<TEvent>, DefaultedKey>> & {
    weekStartsOn: WeekdayIndex;
    weekEndsOn: WeekdayIndex;
    is12Hour: boolean;
    messages: CalendarMessages;
    swipeNavigation: boolean;
    maxFontSizeMultiplier: number;
    scheduleDays: number;
    slotPressMode: SlotPressMode;
    showMorePopover: boolean;
    testID: string;
  };
