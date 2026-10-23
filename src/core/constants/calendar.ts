/**
 * @file Default calendar prop values and shared configuration constants.
 */

/** Header view order (excludes Custom Days, which is dynamic). */
export const VIEW_ORDER = ["day", "week", "month", "schedule"] as const;

/** Platform-free defaults merged into the calendar props when the consumer omits a prop. */
export const CORE_DEFAULTS = {
  events: [],
  view: "month",
  locale: "en",
  is12Hour: false,
  selectable: false,
  creatable: false,
  dayType: "half",
  pastYearLength: 5,
  futureYearLength: 5,
  showCurrentTime: false,
  autoScrollToCurrentTime: false,
  minHour: 0,
  maxHour: 24,
  weekStartsOn: 0,
  showAdjacentMonths: true,
  showWeekNumbers: false,
  resetDateOnViewChange: false,
  showAllDayRow: true,
  eventOverlapOffset: 0,
  enableEnrichedEvents: false,
  eventsAreSorted: false,
  isEventOrderingEnabled: true,
  sortedMonthView: true,
  isLoading: false,
  theme: {},
  scheduleDays: 30,
} as const;

/**
 * Locale primary subtags that default to RTL layout when no explicit `direction` prop is given.
 * Match is case-insensitive and handles BCP-47 region/script tags (e.g. ar-SA → ar).
 */
export const RTL_LOCALES = [
  "ar", // Arabic
  "he", // Hebrew
  "fa", // Persian / Farsi
  "ur", // Urdu
  "ps", // Pashto
  "sd", // Sindhi
  "ckb", // Central Kurdish (Sorani)
  "yi", // Yiddish
] as const;

/** Action type strings dispatched to the calendar reducer. */
export const CALENDAR_ACTIONS = {
  SET_DATE: "SET_DATE",
  SET_VIEW: "SET_VIEW",
  SET_CUSTOM_DAYS: "SET_CUSTOM_DAYS",
  NEXT: "NEXT",
  PREV: "PREV",
  TODAY: "TODAY",
  EXTEND_SCHEDULE: "EXTEND_SCHEDULE",
} as const;
