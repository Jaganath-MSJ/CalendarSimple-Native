/**
 * @file Measured calendar size, the active page and the view-level config.
 */
import { createContext, useCallback, useContext } from "react";
import { useCalendarConfig } from "./CalendarContext";
import type { CalendarEvent, ResolvedConfig } from "../types";

export interface CalendarLayout {
  /** Container width (0 until measured). */
  width: number;
  /** Container height (0 until measured). */
  height: number;
  /** Measured header height; `undefined` until the header lays out. */
  headerHeight?: number;
}

const LayoutContext = createContext<CalendarLayout>({ width: 0, height: 0 });
export const CalendarLayoutProvider = LayoutContext.Provider;

/** The measured root size and header height. */
export function useCalendarLayout(): CalendarLayout {
  return useContext(LayoutContext);
}

/**
 * Whether the subtree is the current pager page. Neighbour pages render the
 * same views without test IDs so `{t}-…` IDs stay unique.
 */
const PageContext = createContext(true);
export const PageProvider = PageContext.Provider;

/** `true` on the current pager page (and outside a pager). */
export function useIsCurrentPage(): boolean {
  return useContext(PageContext);
}

/** Returns `id(suffix)`: `"{t}-{suffix}"` on the current page, else `undefined`. */
export function useTestID(): (suffix: string) => string | undefined {
  const { testId } = useCalendarConfig();
  const isCurrent = useContext(PageContext);
  return useCallback(
    (suffix: string) => (isCurrent ? `${testId}-${suffix}` : undefined),
    [isCurrent, testId],
  );
}

/** Config merged with a view's local props (set by the view components). */
const ViewConfigContext = createContext<ResolvedConfig | undefined>(undefined);
export const ViewConfigProvider = ViewConfigContext.Provider;

/** The enclosing view's merged config, or the root config outside a view. */
export function useViewConfig<
  TEvent extends CalendarEvent = CalendarEvent,
>(): ResolvedConfig<TEvent> {
  const own = useContext(ViewConfigContext);
  const { config } = useCalendarConfig<TEvent>();
  // The view stores the widened config; callers narrow it like useCalendarConfig.
  return (own as unknown as ResolvedConfig<TEvent> | undefined) ?? config;
}
