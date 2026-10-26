/**
 * @file The current time, refreshed every minute and on app resume.
 */
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { dateFn, type DateType } from "../core";

/**
 * `read()`, re-read on each `intervalMs` boundary while the app is active,
 * paused on `background`/`inactive`, and re-read immediately on `active`.
 * React skips the re-render when the value is unchanged (`Object.is`).
 */
function useClock<T>(read: () => T, intervalMs: number): T {
  const [value, setValue] = useState(() => read());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      stop();
      const delay = intervalMs - (Date.now() % intervalMs);
      timer = setTimeout(() => {
        setValue(() => read());
        schedule();
      }, delay);
    };
    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        setValue(() => read());
        schedule();
      } else if (state === "background" || state === "inactive") {
        stop();
      }
    };
    schedule();
    const sub = AppState.addEventListener("change", onChange);
    return () => {
      stop();
      sub.remove();
    };
    // `read` is a module-level function in both callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return value;
}

const readToday = () => dateFn().toISODate() ?? "";

/**
 * Current time. Ticks on each `intervalMs` boundary while the app is active,
 * pauses on `background`/`inactive`, and refreshes immediately on `active`
 * (so "today" moves when the app resumes after midnight).
 */
export function useNow(intervalMs = 60_000): DateType {
  return useClock(dateFn, intervalMs);
}

/**
 * Today's ISO date. Same clock as `useNow`, but re-renders only when the
 * date changes (midnight, or resume on a later day), not every minute.
 */
export function useToday(): string {
  return useClock(readToday, 60_000);
}
