/**
 * @file The `Calendar` root component (TDD §8.1).
 */
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { dateFn, type ECalendarViewType } from "../core";
import { applyDefaults } from "../config/applyDefaults";
import { CalendarProvider, useCalendarState } from "../context/CalendarContext";
import { useDateRangeNotifier } from "../hooks/useDateRangeNotifier";
import { useEvents } from "../hooks/useEvents";
import { useResolvedColorScheme } from "../hooks/useResolvedColorScheme";
import type { CalendarEvent, CalendarProps, ResolvedConfig } from "../types";
import { CalendarContent } from "./CalendarContent";
import { Header } from "./header/Header";

/** Sub-components attached to `Calendar`; later phases add entries. */
export interface CalendarStatics {
  Header: typeof Header;
}

export type CalendarComponent = (<TEvent extends CalendarEvent = CalendarEvent>(
  props: CalendarProps<TEvent>,
) => ReactElement | null) &
  CalendarStatics;

function shallowEqual(a: object, b: object): boolean {
  const ka = Object.keys(a) as (keyof typeof a)[];
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => Object.is(a[k], b[k]));
}

/**
 * `applyDefaults(props)` memoised on a shallow comparison of the props (#19),
 * so the config context keeps its identity across parent renders that pass
 * equal props.
 */
function useResolvedConfig<TEvent extends CalendarEvent>(
  props: CalendarProps<TEvent>,
): ResolvedConfig<TEvent> {
  const [cache, setCache] = useState(() => ({
    props,
    config: applyDefaults(props),
  }));
  if (!shallowEqual(cache.props, props)) {
    const next = { props, config: applyDefaults(props) };
    setCache(next);
    return next.config;
  }
  return cache.config;
}

/** Effect that skips the first run (the initial state already holds the prop). */
function useSyncEffect(effect: () => void, key: unknown): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    effect();
    // Keyed on the value only; `effect` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Prop → state sync by value (#11), in both default and compound mode. */
function PropSync({
  selectedDate,
  view,
  customDays,
}: {
  selectedDate?: Date;
  view?: ECalendarViewType;
  customDays?: number;
}) {
  const { dispatch } = useCalendarState();
  const time = selectedDate?.getTime();
  useSyncEffect(() => {
    if (time !== undefined)
      dispatch({ type: "SET_DATE", payload: dateFn(time) });
  }, time);
  useSyncEffect(() => {
    if (view) dispatch({ type: "SET_VIEW", payload: view });
  }, view);
  useSyncEffect(() => {
    if (customDays) dispatch({ type: "SET_CUSTOM_DAYS", payload: customDays });
  }, customDays);
  return null;
}

/** Runs `useDateRangeNotifier` inside the provider without re-rendering the content. */
function DateRangeNotifier() {
  useDateRangeNotifier();
  return null;
}

function CalendarRoot<TEvent extends CalendarEvent = CalendarEvent>(
  props: CalendarProps<TEvent>,
) {
  const { children, ...rest } = props;
  const base = useResolvedConfig(rest);
  const events = useEvents(base.events, base);
  const config = useMemo(() => ({ ...base, events }), [base, events]);
  const scheme = useResolvedColorScheme(config.colorScheme);

  return (
    <CalendarProvider
      initialDate={dateFn(props.selectedDate)}
      initialView={config.view}
      initialCustomDays={props.customDays}
      testId={config.testID}
      config={config}
      colorScheme={scheme}
    >
      <PropSync
        selectedDate={props.selectedDate}
        view={props.view}
        customDays={props.customDays}
      />
      <DateRangeNotifier />
      <CalendarContent width={props.width} height={props.height}>
        {children}
      </CalendarContent>
    </CalendarProvider>
  );
}

const statics: CalendarStatics = { Header };

/** `React.memo` drops type parameters, so the export is cast (TDD §6.3). */
export const Calendar = Object.assign(
  memo(CalendarRoot),
  statics,
) as unknown as CalendarComponent;

export default Calendar;
