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

/**
 * A moment in a drag or resize for `onHaptic`: the event lifts, it crosses
 * a snap step, it is dropped, a resize is released, or the drag ends without
 * a change.
 */
export type HapticKind = "lift" | "snap" | "drop" | "resize" | "cancel";

/** What `onEventResize` receives when an event is resized. */
export interface EventResizeInfo<TEvent extends CalendarEvent = CalendarEvent> {
  /** The event as shown (an occurrence for a recurring event). */
  event: TEvent;
  /** New start (changed when `edge` is `"top"`). */
  start: Date;
  /** New end (changed when `edge` is `"bottom"`). */
  end: Date;
  /** The edge that moved. */
  edge: "top" | "bottom";
  /** The view it was resized in. */
  view: ECalendarViewType;
}

/** What `onEventDrop` receives when an event is moved. */
export interface EventDropInfo<TEvent extends CalendarEvent = CalendarEvent> {
  /** The event as shown (an occurrence for a recurring event). */
  event: TEvent;
  /** New start. */
  start: Date;
  /** New end (same length; equal to `start` when the event has no `endDate`). */
  end: Date;
  /** `true` for a date-only (all-day) event. */
  allDay: boolean;
  /** The view it was moved in. */
  view: ECalendarViewType;
}

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
  /** Web only: arrow keys, Home/End, PageUp/PageDown and T (default `true`). */
  keyboardNavigation?: boolean;
  maxFontSizeMultiplier?: number;
  // Layout
  width?: DimensionValue;
  height?: DimensionValue;
  safeAreaInsets?: SafeAreaInsets;
  // Callbacks
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: TEvent) => void;
  onEventLongPress?: (event: TEvent) => void;
  /**
   * Lets events be moved: by long-press drag with `<CalendarGestures>` from
   * `calendar-simple-native/gestures`, and always by the screen-reader move
   * actions. A function decides per event. Needs `onEventDrop`.
   */
  draggable?: boolean | ((event: TEvent) => boolean);
  /** A moved event's new times. The calendar never changes `events` itself. */
  onEventDrop?: (info: EventDropInfo<TEvent>) => void;
  /** Minutes per step when moving in time grids (default 15). */
  dragSnapMinutes?: number;
  /**
   * Lets timed events in Day, Week and Custom Days be resized from their top
   * or bottom edge (long press near the edge, with `<CalendarGestures>`),
   * and by the screen-reader actions. A function decides per event. Needs
   * `onEventResize`.
   */
  resizable?: boolean | ((event: TEvent) => boolean);
  /** A resized event's new times. The calendar never changes `events`. */
  onEventResize?: (info: EventResizeInfo<TEvent>) => void;
  /** Minutes per step when resizing (default 15). */
  resizeSnapMinutes?: number;
  /** Shortest length a resize leaves, in minutes (default 15). */
  minEventDurationMinutes?: number;
  /**
   * Moments to give haptic feedback for while dragging or resizing with
   * `<CalendarGestures>` (`"snap"` at most every 50 ms). The calendar has
   * no haptics dependency: call your own (e.g. `expo-haptics`). Never
   * called on web.
   */
  onHaptic?: (kind: HapticKind) => void;
  /**
   * Pinch the time grid to change the hour height (with `<CalendarGestures>`
   * from `calendar-simple-native/gestures`). Default `false`.
   */
  pinchToZoom?: boolean;
  /**
   * Height of one hour in the time grids, in pt. Set it to control the zoom
   * (update it from `onHourHeightChange`); leave it out to let pinching
   * change it. Default: the theme's 60.
   */
  hourHeight?: number;
  /** Smallest hour height a pinch reaches (default 30). */
  minHourHeight?: number;
  /** Largest hour height a pinch reaches (default 180). */
  maxHourHeight?: number;
  /** A pinch ended at a new hour height. */
  onHourHeightChange?: (hourHeight: number) => void;
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
  | "keyboardNavigation"
  | "dragSnapMinutes"
  | "resizeSnapMinutes"
  | "minEventDurationMinutes"
  | "minHourHeight"
  | "maxHourHeight"
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
    keyboardNavigation: boolean;
    dragSnapMinutes: number;
    resizeSnapMinutes: number;
    minEventDurationMinutes: number;
    minHourHeight: number;
    maxHourHeight: number;
    testID: string;
  };
