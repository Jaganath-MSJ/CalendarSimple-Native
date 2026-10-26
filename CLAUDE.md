# calendar-simple-native

React Native port of `calendar-simple` (iOS, Android, web). Pure TypeScript core plus a thin React Native layer; an Expo example app is the test bed.

## Commands

| Purpose                 | Command                                           |
| ----------------------- | ------------------------------------------------- |
| One core test file      | `npx vitest run <path>`                           |
| One component test file | `npx jest <path>`                                 |
| All tests               | `npm test` (runs `test:core` then `test:ui`)      |
| Type check + lint       | `npm run lint`                                    |
| Format check            | `npm run format:check`                            |
| Build                   | `npm run build`                                   |
| Example app             | `npm run example -- start` (then `i`, `a` or `w`) |
| Web e2e                 | `npm run e2e:web`                                 |

## Layer rule

Components -> hooks/theme/context -> core. Core (`src/core/`) imports only `luxon`: nothing from `react`, `react-native` or `react-dom` (enforced by ESLint `no-restricted-imports`). Internal dates are Luxon `DateTime`; JS `Date` appears only in public props and callbacks.

## Folder map

- `src/core/` types, constants, date utils, layout algorithms, reducer, navigation, titles, messages, locale defaults (`SOURCE.md` records the web commit and every divergence)
- `src/config/`, `src/context/`, `src/hooks/`, `src/theme/`, `src/components/`, `src/types/`
- `src/test-utils/` shared Jest helpers
- `example/` Expo app (iOS, Android, web): view screens, Intl check, playground
- `e2e/` Maestro flows; `e2e-web/` Playwright specs and baselines

## Testing patterns

- Core: Vitest (node) with `freezeNow` / `restoreNow` / `withZone` from `src/core/test/clock.ts`; fixtures in `src/core/test/fixtures.ts`.
- UI: Jest (`jest-expo`, iOS and Android) with `renderCalendar` and `useFrozenClock` from `src/test-utils/`. RNTL 14: `render` is async, so `await render(...)`.
- Web is covered by Playwright against `expo export -p web`.

## Test IDs

Follow port spec section 9, prefixed by the `testID` prop (default `"calendar"`). New native IDs are listed in the task that adds them.

## Commits and branches

- Conventional Commits.
- All work happens on the single branch `dev`; no per-phase or per-slice branches.
- One commit per group of 2-3 slices; earlier slices in a group only stage, the last runs `npm test && npm run lint` and commits.
- Push and open PRs only when asked.

## Copied web code

Code copied from the web library keeps its JSDoc. Record every intentional divergence in `src/core/SOURCE.md` in the same commit.

## Local docs (not committed)

`docs/` is local only (listed in `.git/info/exclude`); never `git add -f` it and never link to it from committed files. It holds:

- `docs/technical-design.md` (TDD)
- `docs/react-native-port-spec.md` (behaviour spec)
- the implementation plans and slice reports (`docs/intl-report.md`, ...)
