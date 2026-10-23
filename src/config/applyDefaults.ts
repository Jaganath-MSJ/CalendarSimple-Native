/**
 * @file Merges defaults into the calendar props (TDD §8.1 step 1).
 */
import { Platform, type PlatformOSType } from "react-native";
import {
  CORE_DEFAULTS,
  resolveIs12Hour,
  resolveMessages,
  resolveWeekStart,
  type WeekdayIndex,
} from "../core";
import type { CalendarEvent, CalendarProps, ResolvedConfig } from "../types";

/** Native-only defaults (TDD §6.3). `swipeNavigation` depends on the OS. */
const NATIVE_DEFAULTS = {
  slotPressMode: "press",
  showMorePopover: true,
  maxFontSizeMultiplier: 1.5,
  testID: "calendar",
  styles: {},
  colorScheme: "auto",
  safeAreaInsets: {},
  refreshing: false,
} as const;

/**
 * Returns the resolved config: core and native defaults, then every defined
 * prop (#13: an explicit `undefined` keeps the default), then `"locale"`
 * values resolved, `weekEndsOn` derived and messages merged key by key.
 */
export function applyDefaults<TEvent extends CalendarEvent>(
  props: CalendarProps<TEvent>,
  os: PlatformOSType = Platform.OS,
): ResolvedConfig<TEvent> {
  const merged: Record<string, unknown> = {
    ...CORE_DEFAULTS,
    ...NATIVE_DEFAULTS,
    swipeNavigation: os !== "web",
  };
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) merged[key] = value;
  }

  const locale = merged.locale as string;
  const weekStartsOn = resolveWeekStart(
    merged.weekStartsOn as WeekdayIndex | "locale",
    locale,
  );
  const weekEndsOn =
    props.weekEndsOn ?? (((weekStartsOn + 6) % 7) as WeekdayIndex);

  return {
    ...merged,
    weekStartsOn,
    weekEndsOn,
    is12Hour: resolveIs12Hour(merged.is12Hour as boolean | "locale", locale),
    messages: resolveMessages(props.localeMessages),
  } as unknown as ResolvedConfig<TEvent>; // Record built key by key from typed sources.
}
