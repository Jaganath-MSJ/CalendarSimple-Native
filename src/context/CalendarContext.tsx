/**
 * @file Calendar state and config contexts (TDD §8.2).
 *
 * State and config live in separate contexts so components that read only
 * config do not re-render on navigation. `useCalendar` composes both into
 * the web-compatible shape.
 */
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import {
  calendarReducer,
  createInitialState,
  type CalendarAction,
  type CalendarState,
  type DateType,
  type ECalendarViewType,
} from "../core";
import { applyDefaults } from "../config/applyDefaults";
import type { CalendarEvent, ResolvedConfig } from "../types";

interface StateValue {
  state: CalendarState;
  dispatch: Dispatch<CalendarAction>;
}

interface ConfigValue {
  config: ResolvedConfig;
  testId: string;
  colorScheme: "light" | "dark";
}

const CalendarStateContext = createContext<StateValue | undefined>(undefined);
const CalendarConfigContext = createContext<ConfigValue | undefined>(undefined);

export interface CalendarProviderProps<
  TEvent extends CalendarEvent = CalendarEvent,
> {
  children: ReactNode;
  initialDate: DateType;
  initialView: ECalendarViewType;
  initialCustomDays?: number;
  testId?: string;
  config?: ResolvedConfig<TEvent>;
  /** Resolved scheme; when omitted, resolved from `config.colorScheme` and the OS. */
  colorScheme?: "light" | "dark";
}

const FALLBACK_CONFIG = applyDefaults({});

export function CalendarProvider<TEvent extends CalendarEvent = CalendarEvent>({
  children,
  initialDate,
  initialView,
  initialCustomDays,
  testId,
  config,
  colorScheme,
}: CalendarProviderProps<TEvent>) {
  const [state, dispatch] = useReducer(
    calendarReducer,
    createInitialState(initialDate, initialView, initialCustomDays),
  );
  const osScheme = useColorScheme();
  // Generic config is stored widened; `useCalendar<TEvent>` narrows it back.
  const resolvedConfig = (config ?? FALLBACK_CONFIG) as ResolvedConfig;
  const requested = resolvedConfig.colorScheme;
  const scheme =
    colorScheme ??
    ((requested === "auto" ? osScheme : requested) === "dark"
      ? "dark"
      : "light");
  const resolvedTestId = testId ?? resolvedConfig.testID;

  const stateValue = useMemo(() => ({ state, dispatch }), [state]);
  const configValue = useMemo(
    () => ({
      config: resolvedConfig,
      testId: resolvedTestId,
      colorScheme: scheme,
    }),
    [resolvedConfig, resolvedTestId, scheme],
  );

  return (
    <CalendarConfigContext.Provider value={configValue}>
      <CalendarStateContext.Provider value={stateValue}>
        {children}
      </CalendarStateContext.Provider>
    </CalendarConfigContext.Provider>
  );
}

const OUTSIDE = "useCalendar must be used within a CalendarProvider";

/** Internal: state and dispatch only (changes on navigation). */
export function useCalendarState(): StateValue {
  const value = useContext(CalendarStateContext);
  if (value === undefined) throw new Error(OUTSIDE);
  return value;
}

/** Internal: config, testId and scheme only (does not change on navigation). */
export function useCalendarConfig<
  TEvent extends CalendarEvent = CalendarEvent,
>(): {
  config: ResolvedConfig<TEvent>;
  testId: string;
  colorScheme: "light" | "dark";
} {
  const value = useContext(CalendarConfigContext);
  if (value === undefined) throw new Error(OUTSIDE);
  return value as unknown as {
    config: ResolvedConfig<TEvent>;
    testId: string;
    colorScheme: "light" | "dark";
  }; // Narrows the stored config to the caller's event type.
}

/** Web-compatible calendar context: `{ state, dispatch, testId, config, colorScheme }`. */
export function useCalendar<TEvent extends CalendarEvent = CalendarEvent>(): {
  state: CalendarState;
  dispatch: Dispatch<CalendarAction>;
  testId: string;
  config: ResolvedConfig<TEvent>;
  colorScheme: "light" | "dark";
} {
  const config = useCalendarConfig<TEvent>();
  const { state, dispatch } = useCalendarState();
  return { ...config, state, dispatch };
}
