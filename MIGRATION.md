# Migrating from calendar-simple (web)

`calendar-simple-native` keeps every prop name, callback and render prop of
[calendar-simple](https://github.com/Jaganath-MSJ/CalendarSimple) v2.1 unless
it is listed below. Events use the same shape and date strings.

## Changed props

| Web                                    | Native                                                       | Why                                                         |
| -------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `classNames: CalendarClassNames`       | `styles: CalendarStyles` (same 20 keys, React Native styles) | No CSS classes in React Native; styles are applied last     |
| `testId`                               | `testID` (default `"calendar"`)                              | React Native naming; it prefixes every test ID              |
| `width` / `height`: `number \| string` | `number \| \`${number}%\``                                   | Only numbers and percentages are valid React Native lengths |
| `event.style`: any CSS                 | `backgroundColor`, `color`, `borderColor`, `opacity` only    | Layout keys in `event.style` could break event placement    |
| `is12Hour: boolean`                    | `boolean \| "locale"`                                        | Follow the locale's hour cycle                              |
| `weekStartsOn: number`                 | `WeekdayIndex \| "locale"`                                   | Follow the locale's first day of the week                   |
| `weekEndsOn` default `6`               | default: the day before `weekStartsOn`                       | Same as web when the week starts on Sunday                  |
| `onMoreClick(date, hiddenEvents?)`     | `hiddenEvents` is always passed                              |                                                             |

```tsx
// Web: <Calendar testId="team" classNames={{ event: "my-event" }} width="100%" />
import Calendar from "calendar-simple-native";

export function Team() {
  return (
    <Calendar
      testID="team"
      styles={{ event: { borderLeftWidth: 4, borderLeftColor: "black" } }}
      width="100%"
    />
  );
}
```

## New props

| Prop                                  | What it does                                                  |
| ------------------------------------- | ------------------------------------------------------------- |
| `palette`                             | Colour tokens for light and dark (replaces the CSS variables) |
| `onDateRangeChange(start, end, view)` | The visible range settled; load events for it                 |
| `onEventLongPress(event)`             | An event was long-pressed                                     |
| `slotPressMode`                       | Create with a press (default) or a long press                 |
| `swipeNavigation`                     | Swipe between periods (default on, off on web)                |
| `onRefresh` / `refreshing`            | Schedule pull-to-refresh                                      |
| `showMorePopover`                     | `false` lets `onMoreClick` handle "+N more" alone             |
| `maxFontSizeMultiplier`               | Caps system font scaling (default 1.5)                        |
| `safeAreaInsets`                      | Padding for the day sheet and menus                           |
| Generic `Calendar<TEvent>`            | Callbacks and render props receive your event type            |

## Behaviour differences

| Area                   | Web 2.1                                                                              | Native                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Week title             | Built from ISO weeks (Mon–Sun), so a Sunday-start week can show the wrong months     | Built from the visible days                                                        |
| Auto-scroll to now     | Ignores `minHour`; runs only on mount                                                | Centres the now line, accounts for `minHour`, re-runs when the visible days change |
| Event ending at 00:00  | Month view also draws it on the next day                                             | Ends on the previous day everywhere (month, banner, schedule)                      |
| Month "auto" max       | A string `height` gives 0 visible events                                             | Always measured; phone cells use thin bars and fit more                            |
| Multi-day chip width   | Ignores the week-number column                                                       | Subtracts it                                                                       |
| Compound mode          | `view` / `selectedDate` / `customDays` changes after mount are ignored with children | Synced in both modes                                                               |
| Year bounds            | `pastYearLength` / `futureYearLength` fill the picker only                           | Same: navigation is never clamped, and the picker always includes the shown year   |
| Defaults               | An explicit `undefined` (e.g. `minHour={undefined}`) erases the default              | `undefined` falls back to the default                                              |
| Timed event, no end    | 1-minute block                                                                       | Same 1-minute event, drawn at the minimum height                                   |
| Missing title          | Empty                                                                                | Empty on screen; read as "No title" by screen readers                              |
| Today in another month | An adjacent-month cell showing today is not marked                                   | Marked with a muted outline                                                        |
| "+N more"              | Always opens the popover                                                             | `showMorePopover={false}` hands it to `onMoreClick` only                           |
| Invalid dates          | Only `endDate < startDate` is filtered; unparseable dates pass through               | Unparseable dates are dropped too, with one development warning                    |
| Daylight-saving days   | Event position from millisecond differences                                          | Wall-clock position, so events stay at their printed time                          |
| Phone layout           | Same as desktop, scaled                                                              | Month uses event bars and a day sheet; time grids fit the width when swiping is on |
| Palette                | Web colours                                                                          | A refreshed palette with a dark scheme; set `palette` to match your web colours    |

## No native equivalent

| Web                                                 | Use instead                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| CSS variables (`--primary-color`, `--bg-color`, …)  | `palette` tokens (`primary`, `bg`, `textPrimary`, `border`, …)            |
| CSS classes (`classNames`), `:hover`, media queries | `styles` per part; the calendar picks phone, compact or wide by its width |
| Keyboard navigation (Tab, arrows, Esc)              | Screen-reader roles and labels; on web, Tab and Enter still work          |
| `data-testid`                                       | `testID` (React Native maps it to `data-testid` on web)                   |

```tsx
// Web: .calendar { --primary-color: #7c3aed; --bg-color: #fafafa; }
import Calendar from "calendar-simple-native";

export function Purple() {
  return (
    <Calendar palette={{ light: { primary: "#7c3aed", bg: "#fafafa" } }} />
  );
}
```

## Upgrading from calendar-simple-native 1.0

Changes in 1.1 that can need edits in an app written for 1.0.

### Event type: pass it explicitly

The event type is no longer inferred from `events` or the callbacks (same as
calendar-simple). Pass it as a type argument; without one, callbacks get a
plain `CalendarEvent` (extra fields read as `unknown`).

```tsx
import Calendar, { type CalendarEvent } from "calendar-simple-native";

interface Meeting extends CalendarEvent {
  room: string;
}

export function Rooms({ meetings }: { meetings: Meeting[] }) {
  // 1.0 also inferred Meeting from `events`; 1.1 needs <Meeting>.
  return (
    <Calendar<Meeting>
      events={meetings}
      onEventClick={(meeting) => console.log(meeting.room)}
    />
  );
}
```

### `customDays` takes 1–7

`customDays` is now typed `CustomDaysCount` (`1 | 2 | 3 | 4 | 5 | 6 | 7`,
exported), as in calendar-simple. Other numbers (from JavaScript or stored
settings) are rounded and clamped to 1–7 (`NaN` gives 3), so the view always
draws; 1.0 drew nothing outside 1–10. In TypeScript, a `number` variable
needs narrowing:

```tsx
import Calendar, { type CustomDaysCount } from "calendar-simple-native";

export function Planner({ days }: { days: number }) {
  return <Calendar view="customDays" customDays={days as CustomDaysCount} />;
}
```

### Schedule lists every event

Schedule now lists every event, as in calendar-simple: the 30-day window,
`scheduleDays` and `onEndReached` are gone (passing them logs a warning in
development). The header has no Prev/Next in Schedule and its title spans the
events; Today and date picks scroll to the first day on or after the date, and
`autoScrollToCurrentTime` does the same when the list opens. PageUp/PageDown do
nothing there. `onDateRangeChange` reports the window around the selected date
(two months before to twelve months after, whole quarters), widened by any
events outside it, so an app that loads by range keeps working; an event
lasting months fills its days only inside that window (and shows on its first
day).

```tsx
import Calendar, { type CalendarEvent } from "calendar-simple-native";

export function Agenda({ events }: { events: CalendarEvent[] }) {
  // 1.0: scheduleDays={60} onEndReached={loadMore}
  return <Calendar view="schedule" events={events} autoScrollToCurrentTime />;
}
```
