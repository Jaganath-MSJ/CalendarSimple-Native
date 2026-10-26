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
| `scheduleDays`                        | Length of the Schedule window (default 30)                    |
| `onRefresh` / `refreshing`            | Schedule pull-to-refresh                                      |
| `onEndReached`                        | The Schedule window grew at its end                           |
| `showMorePopover`                     | `false` lets `onMoreClick` handle "+N more" alone             |
| `maxFontSizeMultiplier`               | Caps system font scaling (default 1.5)                        |
| `safeAreaInsets`                      | Padding for the day sheet and menus                           |
| Generic `Calendar<TEvent>`            | Callbacks and render props receive your event type            |

## Behaviour differences

| Area                   | Web 2.1                                                                              | Native                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Week title             | Built from ISO weeks (Mon–Sun), so a Sunday-start week can show the wrong months     | Built from the visible days                                                              |
| Auto-scroll to now     | Ignores `minHour`; runs only on mount                                                | Centres the now line, accounts for `minHour`, re-runs when the visible days change       |
| Schedule range         | Lists every event; prev/next only change the title                                   | A window of `scheduleDays` days from the selected date; grows on scroll (`onEndReached`) |
| Event ending at 00:00  | Month view also draws it on the next day                                             | Ends on the previous day everywhere (month, banner, schedule)                            |
| Month "auto" max       | A string `height` gives 0 visible events                                             | Always measured; phone cells use thin bars and fit more                                  |
| Multi-day chip width   | Ignores the week-number column                                                       | Subtracts it                                                                             |
| Compound mode          | `view` / `selectedDate` / `customDays` changes after mount are ignored with children | Synced in both modes                                                                     |
| Year bounds            | `pastYearLength` / `futureYearLength` fill the picker only                           | Same: navigation is never clamped, and the picker always includes the shown year         |
| Defaults               | An explicit `undefined` (e.g. `minHour={undefined}`) erases the default              | `undefined` falls back to the default                                                    |
| Timed event, no end    | 1-minute block                                                                       | Same 1-minute event, drawn at the minimum height                                         |
| Missing title          | Empty                                                                                | Empty on screen; read as "No title" by screen readers                                    |
| Today in another month | An adjacent-month cell showing today is not marked                                   | Marked with a muted outline                                                              |
| "+N more"              | Always opens the popover                                                             | `showMorePopover={false}` hands it to `onMoreClick` only                                 |
| Invalid dates          | Only `endDate < startDate` is filtered; unparseable dates pass through               | Unparseable dates are dropped too, with one development warning                          |
| Daylight-saving days   | Event position from millisecond differences                                          | Wall-clock position, so events stay at their printed time                                |
| Phone layout           | Same as desktop, scaled                                                              | Month uses event bars and a day sheet; time grids fit the width when swiping is on       |
| Palette                | Web colours                                                                          | A refreshed palette with a dark scheme; set `palette` to match your web colours          |

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
