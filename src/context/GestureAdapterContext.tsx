/**
 * @file Gesture seam (TDD §8.2): plain wrappers in v1.0, so a later
 * gesture-handler adapter can wrap events and the time grid without changing
 * the views.
 */
import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react";

export interface GestureAdapter {
  EventWrapper?: ComponentType<{ children: ReactNode }>;
  TimeGridWrapper?: ComponentType<{ children: ReactNode }>;
}

const EMPTY: GestureAdapter = {};

const GestureAdapterContext = createContext<GestureAdapter>(EMPTY);

export function GestureAdapterProvider({
  value,
  children,
}: {
  value: GestureAdapter;
  children: ReactNode;
}) {
  return (
    <GestureAdapterContext.Provider value={value}>
      {children}
    </GestureAdapterContext.Provider>
  );
}

/** The current adapter; an empty object by default. */
export function useGestureAdapter(): GestureAdapter {
  return useContext(GestureAdapterContext);
}
