# Contributing

Thanks for helping improve `calendar-simple-native`. Bug reports, feature
ideas and pull requests are all welcome. By taking part you agree to the
[code of conduct](./CODE_OF_CONDUCT.md).

## Before you start

- **Bugs:** open an issue with the bug template: version, platform (iOS,
  Android or web), the props you pass and what you expected.
- **Features:** open an issue first so we can agree on the API before you
  write code.
- **Security issues:** see [SECURITY.md](./SECURITY.md); please don't open a
  public issue.

## Setup

Requires Node 20 or later and npm.

```sh
git clone https://github.com/Jaganath-MSJ/CalendarSimple-Native.git
cd CalendarSimple-Native
git checkout dev
npm install
npm run example -- start   # then i (iOS), a (Android) or w (web)
```

The `example/` Expo app uses the library source directly, so changes in
`src/` reload in the app.

## Project layout

- `src/core/`: pure TypeScript (dates, layouts, reducer). It may import only
  `luxon`, never `react` or `react-native`; ESLint enforces this.
- `src/components/`, `src/hooks/`, `src/theme/`, `src/context/`: the React
  Native layer.
- `example/`: the Expo example app. `e2e/`: Maestro flows. `e2e-web/`:
  Playwright specs.

## Checks

Run these before opening a pull request; CI runs the same ones.

| Purpose              | Command                                        |
| -------------------- | ---------------------------------------------- |
| All tests            | `npm test` (Vitest for core, Jest for the UI)  |
| One core test file   | `npx vitest run <path>`                        |
| One UI test file     | `npx jest <path>`                              |
| Types and lint       | `npm run lint`                                 |
| Formatting           | `npm run format:check` (fix: `npm run format`) |
| README code snippets | `npm run docs:check`                           |
| Bundle size          | `npm run size` (Node 22+)                      |
| Web end-to-end       | `npm run e2e:web` (screenshots: macOS only)    |
| Native end-to-end    | `npm run e2e:native` (needs Maestro)           |

Add or update tests with every change: core logic in Vitest next to the file,
components in Jest with `renderCalendar` from `src/test-utils/`.

## Branches and pull requests

- Branch from **`dev`** and open your pull request against **`dev`**.
- `dev` is merged into `beta` for pre-releases and `beta` into `main` for
  releases; maintainers handle those.
- Keep a pull request to one topic, and update the README when you change
  props or behaviour.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(checked by commitlint). The type decides the release:

| Type                                           | Release |
| ---------------------------------------------- | ------- |
| `fix:`                                         | patch   |
| `feat:`                                        | minor   |
| `feat!:` or a `BREAKING CHANGE:` footer        | major   |
| `docs:`, `test:`, `ci:`, `chore:`, `refactor:` | none    |

Example: `fix(month): keep the day sheet open after rotation`.

Releases, the changelog and npm publishing are automated with
semantic-release.
