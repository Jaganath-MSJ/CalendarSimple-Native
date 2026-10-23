/**
 * @file Jest clock helpers: frozen fake time shared by Jest and Luxon, and an
 * `AppState` emitter.
 *
 * Importing this module registers `beforeEach`/`afterEach` hooks in the test
 * file: `AppState.addEventListener` is captured, and any frozen clock is
 * restored after each test.
 */
import { act } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { Settings } from "luxon";

type Listener = (state: AppStateStatus) => void;

const originalNow = Settings.now;
let frozen = false;
let listeners: Listener[] = [];

function freeze(iso: string): void {
  jest.useFakeTimers({ now: new Date(iso) });
  Settings.now = () => Date.now();
  frozen = true;
}

beforeEach(() => {
  listeners = [];
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((type: string, listener: unknown) => {
      const l = listener as Listener;
      if (type === "change") listeners.push(l);
      return {
        remove: () => {
          listeners = listeners.filter((x) => x !== l);
        },
      };
    });
});

afterEach(() => {
  if (frozen) {
    jest.useRealTimers();
    Settings.now = originalNow;
    frozen = false;
  }
});

/**
 * Freezes Jest's fake clock at `iso` (local time) and points Luxon at it, so
 * `jest.advanceTimersByTime` / `jest.setSystemTime` move Luxon too. Called at
 * the top level of a file (or `describe`) it applies before each test; called
 * inside a test it applies immediately. Restored after each test.
 */
export function useFrozenClock(iso = "2026-10-22T10:40:00"): void {
  if (expect.getState().currentTestName === undefined) {
    beforeEach(() => freeze(iso));
  } else {
    freeze(iso);
  }
}

/** Sends an `AppState` change to every listener the code under test added. */
export async function emitAppState(state: AppStateStatus): Promise<void> {
  await act(() => {
    for (const l of [...listeners]) l(state);
  });
}
