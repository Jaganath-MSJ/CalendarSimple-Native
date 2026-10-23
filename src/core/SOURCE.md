# Core source

Ported from [calendar-simple](https://github.com/Jaganath-MSJ/CalendarSimple) at commit `c0edd48` (2026-10-23).

## Web file → native file

One row per web file; paths in backticks, extra native files comma-separated, notes in parentheses (read by `core:diff`).

| Web file                                                | Native file                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/types/events.ts`                                   | `src/core/types/events.ts` (`BaseCalendarEvent`, generic `EventListType<E>`)          |
| `src/types/calendar.ts`                                 | `src/core/types/calendar.ts` (enums and value types only; props live in the RN layer) |
| `src/types/theme.ts`                                    | `src/core/types/theme.ts` (`CalendarClassNames` dropped)                              |
| `src/utils/date.ts` (types)                             | `src/core/types/date.ts`                                                              |
| `src/constants/calendar.ts`                             | `src/core/constants/calendar.ts`, `src/core/constants/time.ts`                        |
| `src/constants/theme.ts`                                | `src/core/constants/layout.ts`                                                        |
| `src/utils/date.ts`                                     | `src/core/utils/date.ts`                                                              |
| `src/utils/common.ts`                                   | `src/core/utils/common.ts`                                                            |
| `src/utils/formatting.ts`                               | `src/core/utils/formatting.ts`                                                        |
| `src/utils/contrast.ts`                                 | `src/core/utils/contrast.ts`                                                          |
| `src/utils/date.test.ts`                                | `src/core/utils/date.test.ts`                                                         |
| `src/utils/common.test.ts`                              | `src/core/utils/common.test.ts`                                                       |
| `src/utils/formatting.test.ts`                          | `src/core/utils/formatting.test.ts`                                                   |
| `src/utils/contrast.test.ts`                            | `src/core/utils/contrast.test.ts`                                                     |
| `src/hooks/useScheduleView.ts` (`getLastEventDay` only) | `src/core/utils/common.ts`                                                            |
| `src/hooks/useEvents.ts`                                | `src/core/events/validateEvents.ts`                                                   |
| `src/hooks/useEvents.test.ts`                           | `src/core/events/validateEvents.test.ts`                                              |
| `src/hooks/useMonthGrid.ts`                             | `src/core/layout/monthGrid.ts`, `src/core/layout/monthMatrix.ts`                      |
| `src/hooks/useMonthGrid.test.ts`                        | `src/core/layout/monthGrid.test.ts`                                                   |

## Intentional divergences

| #    | What changed                                                                                                                                                                                                                                                                          | Why                                                                                   | Backport                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| #15  | Dead code removed: `DATE_FORMATS.FULL_DATE`, `DATE_FORMATS.DAY_INDEX`, `LAYOUT_CONSTANTS.DEFAULT_ROWS`, `LAYOUT_CONSTANTS.HEADER_HEIGHT`                                                                                                                                              | Unused                                                                                | Yes                         |
| —    | `CALENDAR_ACTIONS.EXTEND_SCHEDULE` added; `CORE_DEFAULTS.scheduleDays = 30`                                                                                                                                                                                                           | Schedule window grows on end reached (TDD §7.1)                                       | No                          |
| #9   | `calculateMaxEvents(height, rows, metrics = MONTH_METRICS.web)` takes cell metrics                                                                                                                                                                                                    | Phone month uses 8 px bars, not 26 px chips                                           | Yes (parameter is optional) |
| —    | `getLastEventDay` moved from `hooks/useScheduleView.ts` into `utils/common.ts` and exported                                                                                                                                                                                           | Shared by month grid, banner and schedule (#8)                                        | Yes                         |
| #15  | `getMonthList` JSDoc and `MonthListType.value` document the 0-based month index                                                                                                                                                                                                       | Web type doc said 1-based; code is 0-based                                            | Yes                         |
| —    | `toCssLength` and `handleKeyboardActivation` dropped                                                                                                                                                                                                                                  | DOM/CSS-only helpers                                                                  | No                          |
| —    | Copied code adjusted for `noUncheckedIndexedAccess` / `verbatimModuleSyntax` (no behaviour change)                                                                                                                                                                                    | Stricter tsconfig                                                                     | No                          |
| —    | `useEvents` hook split into `validateEvents` (filter) and `getEventWarnings` (warning strings); events with an unparseable (or missing) `startDate` or an unparseable `endDate` are dropped and reported as `"[calendar] dropped <n> event(s) with an invalid startDate or endDate."` | Garbage input must not crash (review focus 3); no `console.warn` side effects in core | Yes                         |
| —    | `calendarize` replaced by the Luxon `buildMonthMatrix` (identical output for 2020–2030, every week start)                                                                                                                                                                             | Drop a dependency; no JS `Date` in core                                               | Optional                    |
| #8   | Month grid uses `getLastEventDay`, so a timed event ending at exactly 00:00 no longer shows on the next day                                                                                                                                                                           | Bug fix                                                                               | Yes                         |
| #17C | `CalendarDayInfo.isTodayAdjacent` flags today shown as an adjacent-month cell                                                                                                                                                                                                         | Muted outlined mark                                                                   | Yes                         |
