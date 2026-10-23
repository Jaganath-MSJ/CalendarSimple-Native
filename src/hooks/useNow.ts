/**
 * @file The current time, refreshed every minute and on app resume.
 */
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { dateFn, type DateType } from "../core";

/**
 * Current time. Ticks on each `intervalMs` boundary while the app is active,
 * pauses on `background`/`inactive`, and refreshes immediately on `active`
 * (so "today" moves when the app resumes after midnight).
 */
export function useNow(intervalMs = 60_000): DateType {
  const [now, setNow] = useState(() => dateFn());

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
        setNow(dateFn());
        schedule();
      }, delay);
    };
    const onChange = (state: AppStateStatus) => {
      if (state === "active") {
        setNow(dateFn());
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
  }, [intervalMs]);

  return now;
}
