# calendar-simple-native

A simple, themeable calendar for React Native (iOS, Android, web). It is the
React Native port of [calendar-simple](https://github.com/Jaganath-MSJ/CalendarSimple)
v2.1 and keeps its props, callbacks and render props.

- Month, Week, Day, Custom Days (1–10) and Schedule views
- Swipe paging, pull-to-refresh and "load more" in Schedule
- Light, dark and automatic colour schemes, palette and per-state theme
- Locale-aware names, times, week start and right-to-left layout
- Screen-reader labels, 44 pt touch targets, font scaling, reduce motion
- Pure TypeScript core (Luxon), no native modules: works in Expo Go

Status: pre-release (`1.0.0-beta` coming). Migrating from the web library? See
[MIGRATION.md](./MIGRATION.md).

## Requirements

| Package                  | Version                                  |
| ------------------------ | ---------------------------------------- |
| `react`                  | ≥ 19                                     |
| `react-native`           | ≥ 0.78 with the New Architecture enabled |
| `react-native-web`       | optional, for web                        |
| `luxon` (installed)      | ^3.7.2                                   |
| Expo SDK (example, test) | 58 (React Native 0.88)                   |

## Install

Expo:

```sh
npx expo install calendar-simple-native
```

Bare React Native:

```sh
npm install calendar-simple-native
```

There are no native modules, so no `pod install` or rebuild is needed beyond
what your app already has. `luxon` comes in as a dependency.

## Quick start

The calendar fills its parent, so give the parent a size (for example
`flex: 1`), or pass `width` and `height`.

```tsx
import { View } from "react-native";
import Calendar, { type CalendarEvent } from "calendar-simple-native";

const events: CalendarEvent[] = [
  {
    id: "1",
    title: "Sprint planning",
    startDate: "2026-10-22T10:00:00",
    endDate: "2026-10-22T11:00:00",
  },
  { id: "2", title: "Offsite", startDate: "2026-10-26", endDate: "2026-10-27" },
];

export function MyCalendar() {
  return (
    <View style={{ flex: 1 }}>
      <Calendar
        events={events}
        selectable
        onEventClick={(event) => console.log(event.title)}
        onDateClick={(date) => console.log(date.toDateString())}
      />
    </View>
  );
}
```

### Events

| Field       | Type                 | Notes                                                                                 |
| ----------- | -------------------- | ------------------------------------------------------------------------------------- |
| `id`        | `string`             | optional, used as the list key when present                                           |
| `title`     | `string`             | required; empty titles are read as "No title" by screen readers                       |
| `startDate` | `string`             | `"YYYY-MM-DD"` (all-day) or `"YYYY-MM-DDTHH:mm:ss"` (timed)                           |
| `endDate`   | `string`             | optional, same formats; a date-only end is inclusive, a timed end at 00:00 is not     |
| `style`     | `CalendarEventStyle` | colours only: `backgroundColor`, `color`, `borderColor`, `opacity`                    |
| any other   | `unknown`            | kept and returned unchanged in callbacks (see [Typed events](#typed-events-generics)) |

Events with an unparseable `startDate` or `endDate` are dropped and, in
development, listed in one console warning. A timed event without `endDate`
is one minute long and drawn at the minimum height.

## Props

All props are optional. Dates in props and callbacks are JS `Date` objects.

### Data

| Prop                          | Type                          | Default      | Notes                                               |
| ----------------------------- | ----------------------------- | ------------ | --------------------------------------------------- |
| `events`                      | `TEvent[]`                    | `[]`         |                                                     |
| `selectedDate`                | `Date`                        | today        | synced into the calendar whenever its value changes |
| `view`                        | `ECalendarViewType`           | `"month"`    | `month`, `week`, `day`, `customDays`, `schedule`    |
| `customDays`                  | `number`                      | 3            | days in the Custom Days view, 1–10                  |
| `testID`                      | `string`                      | `"calendar"` | prefix of every test ID                             |
| `isLoading` / `renderLoading` | `boolean` / `() => ReactNode` | `false` / —  | skeleton when empty, overlay over existing events   |

### Behaviour

| Prop                                          | Type                       | Default                   | Notes                                                      |
| --------------------------------------------- | -------------------------- | ------------------------- | ---------------------------------------------------------- |
| `is12Hour`                                    | `boolean \| "locale"`      | `false`                   | `"locale"` follows the locale's hour cycle                 |
| `selectable`                                  | `boolean`                  | `false`                   | dates can be selected (`onDateClick`)                      |
| `creatable`                                   | `boolean`                  | `false`                   | empty slots and cells call `onSlotClick`                   |
| `slotPressMode`                               | `"press" \| "longPress"`   | `"press"`                 | gesture that creates (hour slots and month cells)          |
| `maxEvents`                                   | `number`                   | fits the cell             | events per month cell before "+N more"                     |
| `dayType`                                     | `EDayType`                 | `"half"`                  | weekday name length                                        |
| `pastYearLength` / `futureYearLength`         | `number`                   | `5` / `5`                 | years in the year picker; navigation itself is not limited |
| `showCurrentTime` / `autoScrollToCurrentTime` | `boolean`                  | `false` / `false`         | now line; scroll it into view in time grids                |
| `minHour` / `maxHour`                         | `number`                   | `0` / `24`                | hours shown in time grids                                  |
| `weekStartsOn`                                | `WeekdayIndex \| "locale"` | `0` (Sunday)              | `"locale"` uses the locale's first day                     |
| `weekEndsOn`                                  | `WeekdayIndex`             | day before `weekStartsOn` | for work weeks, e.g. `1`–`5`                               |
| `showAdjacentMonths` / `showWeekNumbers`      | `boolean`                  | `true` / `false`          | month view                                                 |
| `resetDateOnViewChange`                       | `boolean`                  | `false`                   | jump back to today when the view changes                   |
| `showAllDayRow`                               | `boolean`                  | `true`                    | all-day banner in time grids                               |
| `eventOverlapOffset`                          | `number`                   | `0`                       | percent of the column width; > 0 stacks overlapping events |
| `scheduleDays`                                | `number`                   | `30`                      | length of the Schedule window from the selected date       |
| `swipeNavigation`                             | `boolean`                  | `true` (`false` on web)   | swipe between periods in month and time grids              |
| `showMorePopover`                             | `boolean`                  | `true`                    | `false` lets `onMoreClick` handle "+N more" alone          |
| `maxFontSizeMultiplier`                       | `number`                   | `1.5`                     | caps system font scaling for calendar text                 |

### Layout

| Prop             | Type                       | Default  | Notes                                 |
| ---------------- | -------------------------- | -------- | ------------------------------------- |
| `width`/`height` | `number \| \`${number}%\`` | measured | the calendar measures itself if unset |
| `safeAreaInsets` | `SafeAreaInsets`           | `{}`     | padding for bottom sheets and menus   |

### Callbacks

| Prop                       | Signature                                                   | When                                                |
| -------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `onDateClick`              | `(date: Date) => void`                                      | a date is pressed (with `selectable`)               |
| `onEventClick`             | `(event: TEvent) => void`                                   | an event is pressed                                 |
| `onEventLongPress`         | `(event: TEvent) => void`                                   | an event is long-pressed                            |
| `onMoreClick`              | `(date: Date, hiddenEvents: TEvent[]) => void`              | "+N more" is pressed                                |
| `onNavigate`               | `(date: Date) => void`                                      | the period changes                                  |
| `onViewChange`             | `(view: ECalendarViewType) => void`                         | the view changes                                    |
| `onSlotClick`              | `(start: Date, end: Date) => void`                          | an empty slot or cell is pressed (with `creatable`) |
| `onDateRangeChange`        | `(start: Date, end: Date, view: ECalendarViewType) => void` | the visible range changes (once per settle)         |
| `onRefresh` / `refreshing` | `() => void` / `boolean`                                    | Schedule pull-to-refresh                            |
| `onEndReached`             | `() => void`                                                | the Schedule window grew at the end                 |

### Appearance

| Prop             | Type                                                                    | Default     |
| ---------------- | ----------------------------------------------------------------------- | ----------- |
| `theme`          | `CalendarTheme`                                                         | `{}`        |
| `styles`         | `CalendarStyles`                                                        | `{}`        |
| `palette`        | `{ light?: Partial<CalendarPalette>; dark?: Partial<CalendarPalette> }` | —           |
| `colorScheme`    | `"light" \| "dark" \| "auto"`                                           | `"auto"`    |
| `direction`      | `"ltr" \| "rtl"`                                                        | from locale |
| `locale`         | `string`                                                                | `"en"`      |
| `localeMessages` | `Partial<CalendarMessages>`                                             | English     |

### Render props

| Prop                      | Signature                                   |
| ------------------------- | ------------------------------------------- |
| `renderEvent`             | `(event: TEvent) => ReactNode`              |
| `renderHeader`            | `(props: RenderHeaderProps) => ReactNode`   |
| `renderDateCell`          | `(props: RenderDateCellProps) => ReactNode` |
| `renderHourCell`          | `(slotStart: Date) => ReactNode`            |
| `renderScheduleSeparator` | `(date: Date) => ReactNode`                 |

### Performance

| Prop                     | Type                                            | Default | Notes                                          |
| ------------------------ | ----------------------------------------------- | ------- | ---------------------------------------------- |
| `eventsAreSorted`        | `boolean`                                       | `false` | skip sorting when `events` are sorted by start |
| `enableEnrichedEvents`   | `boolean`                                       | `false` | read events from `enrichedEventsByDate`        |
| `enrichedEventsByDate`   | `Record<string, TEvent[]>`                      | —       | events keyed by `"YYYY-MM-DD"`                 |
| `isEventOrderingEnabled` | `boolean`                                       | `true`  | `false` skips overlap placement                |
| `sortedMonthView`        | `boolean \| ((a: TEvent, b: TEvent) => number)` | `true`  | month cell ordering, or your own comparator    |

## Typed events (generics)

`Calendar` is generic over the event type, so callbacks get your own fields
back without casts.

```tsx
import { Text } from "react-native";
import Calendar, { type CalendarEvent } from "calendar-simple-native";

interface Meeting extends CalendarEvent {
  room: string;
  attendees: string[];
}

const meetings: Meeting[] = [
  {
    id: "m1",
    title: "Design review",
    startDate: "2026-10-22T14:00:00",
    endDate: "2026-10-22T15:00:00",
    room: "Orion",
    attendees: ["ana", "li"],
  },
];

export function Meetings() {
  return (
    <Calendar<Meeting>
      events={meetings}
      view="week"
      onEventClick={(meeting) => console.log(meeting.room)}
      renderEvent={(meeting) => (
        <Text numberOfLines={1}>
          {meeting.title} · {meeting.attendees.length} people
        </Text>
      )}
    />
  );
}
```

## Loading events by range

`onDateRangeChange` fires with the first and last visible day whenever the
visible range settles (after mount, navigation, a swipe or a view change),
once for a burst of quick swipes. Use it to fetch only what is on screen.

```tsx
import { useCallback, useState } from "react";
import Calendar, {
  type CalendarEvent,
  type ECalendarViewType,
} from "calendar-simple-native";

declare function fetchEvents(from: Date, to: Date): Promise<CalendarEvent[]>;

export function RemoteCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const onDateRangeChange = useCallback(
    async (start: Date, end: Date, view: ECalendarViewType) => {
      setLoading(true);
      setEvents(await fetchEvents(start, end));
      setLoading(false);
      console.log(`loaded ${view}`);
    },
    [],
  );

  return (
    <Calendar
      events={events}
      isLoading={loading}
      onDateRangeChange={onDateRangeChange}
    />
  );
}
```

## Theming

Three layers, applied in this order:

1. `palette`: the colour tokens (`primary`, `primaryStrong`, `onPrimary`,
   `textPrimary`, `textSecondary`, `bg`, `bgMuted`, `border`,
   `surfaceRaised`, `focus`, `eventDefault`, `nowLine`, `scrim`), separately
   for light and dark.
2. `theme`: colours for the default, today and selected states (month cells,
   the time-grid today number, the schedule today circle), optionally per
   scheme.
3. `styles`: React Native styles per part, applied last. Keys: `root`,
   `header`, `table`, `tableHeader`, `tableDate`, `weekNumber`, `event`,
   `selected`, `today`, `dayHeader`, `dayName`, `dayNumber`, `timeColumn`,
   `timeSlot`, `dayColumn`, `scheduleDateGroup`, `scheduleDateNumber`,
   `scheduleDateSubInfo`, `scheduleTime`, `scheduleTitle`, plus the native
   `daySheet`, `popover`, `menu` and `moreLabel`.

```tsx
import Calendar from "calendar-simple-native";

export function BrandedCalendar() {
  return (
    <Calendar
      colorScheme="auto"
      palette={{
        light: { primary: "#7c3aed", nowLine: "#db2777" },
        dark: { primary: "#a78bfa" },
      }}
      theme={{
        today: { color: "#ffffff", bgColor: "#7c3aed" },
        dark: { selected: { color: "#111827", bgColor: "#a78bfa" } },
      }}
      styles={{
        header: { paddingHorizontal: 16 },
        event: { borderRadius: 2 },
      }}
    />
  );
}
```

## Locale and right-to-left

`locale` drives month and weekday names, times and number shapes. Strings and
accessibility labels come from `localeMessages`; missing keys fall back to
`DEFAULT_MESSAGES` (English) one by one. `direction` defaults from the locale
(Arabic, Hebrew, Persian, Urdu, Pashto, Sindhi, Sorani and Yiddish are
right-to-left) and can be forced either way.

```tsx
import Calendar, { DEFAULT_MESSAGES } from "calendar-simple-native";

export function FrenchCalendar() {
  return (
    <Calendar
      locale="fr"
      weekStartsOn="locale"
      is12Hour="locale"
      localeMessages={{
        today: "Aujourd'hui",
        month: "Mois",
        week: "Semaine",
        day: "Jour",
        more: (n) => `+ ${n} de plus`,
        eventCount: (n) =>
          n === 0 ? "aucun événement" : DEFAULT_MESSAGES.eventCount(n),
      }}
    />
  );
}
```

### Hermes and `Intl`

Measured on Hermes (React Native 0.88):

- Hermes has no `Intl.Locale` week info on iOS or Android, so
  `weekStartsOn="locale"` uses a built-in CLDR week-start table.
- Hour cycle, day periods (`ko` 오전/오후) and native digits (`ar-EG`) work on
  both platforms.
- On iOS, Hermes returns empty month and weekday names for some locales
  (seen with `fr` and `ja`); Android and web are fine. See
  [Known limitations](#known-limitations).

## Compound components

Pass children to compose your own layout from the built-in parts. The props
on `Calendar` (including `view`, `selectedDate` and `customDays`) stay in sync
after mount.

```tsx
import { View } from "react-native";
import Calendar from "calendar-simple-native";

export function ComposedCalendar() {
  return (
    <Calendar view="week">
      <View style={{ flex: 1, padding: 8 }}>
        <Calendar.Header />
        <Calendar.View />
      </View>
    </Calendar>
  );
}
```

Parts: `Calendar.Header`, `Calendar.View` (the current view),
`Calendar.MonthView`, `Calendar.WeekView`, `Calendar.DayView`,
`Calendar.CustomDaysView`, `Calendar.ScheduleView`. `useCalendar()` returns
`state`, `dispatch`, `config`, `testId` and the resolved `colorScheme`;
`CalendarProvider` and `CALENDAR_ACTIONS` are exported for advanced use.

## Accessibility

- Every control, cell, event and slot has a role and a label built from
  `localeMessages` (for example "Sprint planning, 10:00 – 11:00",
  "Create event at 14:00, Thu 22 Oct").
- Touch targets are at least 44 pt (iOS) / 48 dp (Android).
- Text scales with the system font size up to `maxFontSizeMultiplier`.
- Paging and fade animations are skipped when Reduce Motion is on.
- The day sheet is modal for screen readers, and focus returns to the cell
  that opened a popover or sheet.

## Performance

- Pass `eventsAreSorted` when your events are already sorted by start.
- Pass `enableEnrichedEvents` with `enrichedEventsByDate` when you already
  group events by day.
- `isEventOrderingEnabled={false}` skips overlap placement for very dense grids.
- Load by range with `onDateRangeChange` instead of passing years of events.
- Keep `events` referentially stable (`useMemo`/state), so the layouts are not
  recomputed on unrelated renders.

## Test IDs

Every ID starts with `testID` (default `calendar`). The most useful ones:

| ID                                                      | Element                         |
| ------------------------------------------------------- | ------------------------------- |
| `calendar-header`                                       | header                          |
| `calendar-header-title`                                 | period title                    |
| `calendar-header-prev-btn` / `-next-btn` / `-today-btn` | navigation buttons              |
| `calendar-pager`                                        | swipe pager (month, time grids) |
| `<day>-month-cell`, `<id>-month-event-item`             | month cell, month event         |
| `<yyyy-mm-dd>-day-header`, `<yyyy-mm-dd>-<h>-slot`      | time-grid day header, hour slot |
| `<id>-day-event-item`                                   | time-grid event                 |
| `<yyyy-mm-dd>-schedule-section`, `<id>-schedule-event`  | schedule day, schedule event    |

## Example app and demo

The `example/` Expo app has one screen per view plus parity screens for each
web Storybook group (Features, Customization, Localization, Accessibility,
Edge cases, Layout limits, Time formatting, Interactions, Playground):

```sh
npm install
npm run example -- start   # then i, a or w
```

## Known limitations

- On web at phone width, the week view scrolls horizontally (fixed-width
  columns, as in the web library) when `swipeNavigation` is off.
- The native end-to-end (Maestro) flows have not been run in CI yet, and the
  Linux screenshot baselines for the web end-to-end tests are pending.

## License

MIT
