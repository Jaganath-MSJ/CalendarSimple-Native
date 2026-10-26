/**
 * @file Parity with web `Localization.stories.tsx`.
 */
import { ECalendarViewType, type CalendarProps } from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { localeEvents, today } from "../fixtures/storyEvents";

const base = { events: localeEvents, selectedDate: today.toJSDate() };
const AR = {
  today: "اليوم",
  day: "يوم",
  week: "أسبوع",
  month: "شهر",
  schedule: "جدول",
};

const story = (name: string, props: CalendarProps): Scenario => ({
  name,
  props: () => ({ ...base, ...props }),
});

const SCENARIOS: Scenario[] = [
  story("English", { view: ECalendarViewType.month, locale: "en" }),
  story("French", {
    view: ECalendarViewType.week,
    locale: "fr",
    localeMessages: {
      today: "Aujourd'hui",
      day: "Jour",
      week: "Semaine",
      month: "Mois",
      schedule: "Planning",
    },
  }),
  story("Arabic RTL", {
    view: ECalendarViewType.week,
    locale: "ar",
    weekStartsOn: 6,
    weekEndsOn: 5,
    localeMessages: AR,
  }),
  story("Arabic LTR", {
    view: ECalendarViewType.week,
    locale: "ar",
    direction: "ltr",
    weekStartsOn: 6,
    weekEndsOn: 5,
    localeMessages: AR,
  }),
  story("Hebrew RTL", {
    view: ECalendarViewType.month,
    locale: "he",
    localeMessages: {
      today: "היום",
      day: "יום",
      week: "שבוע",
      month: "חודש",
      schedule: "לוח",
    },
  }),
  story("Week starts Saturday", {
    view: ECalendarViewType.week,
    locale: "ar",
    weekStartsOn: 6,
    weekEndsOn: 5,
    localeMessages: AR,
  }),
  story("Locale week start (en-GB)", {
    view: ECalendarViewType.month,
    locale: "en-GB",
    weekStartsOn: "locale",
    is12Hour: "locale",
  }),
  story("Japanese schedule", {
    view: ECalendarViewType.schedule,
    locale: "ja",
    localeMessages: { today: "今日", schedule: "スケジュール" },
  }),
  story("Custom messages", {
    view: ECalendarViewType.customDays,
    customDays: 4,
    localeMessages: {
      today: "CURRENT",
      day: "VIEW DAY",
      week: "VIEW WEEK",
      month: "VIEW MONTH",
      schedule: "VIEW PLAN",
      days: "DAYS OVERRIDE",
    },
  }),
  story("Korean 12-hour", {
    view: ECalendarViewType.week,
    locale: "ko",
    is12Hour: true,
  }),
];

export default function LocalizationScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
