/**
 * @file Moving events (`draggable`, `onEventDrop`): which events may move,
 * and the callback with their new times. Used by drags (gestures entry) and
 * by the screen-reader move actions.
 */
import { useCallback, useMemo } from "react";
import { dateFn, moveEvent, type ECalendarViewType } from "../core";
import { useIsCurrentPage } from "../context/LayoutContext";
import { useCalendarTheme } from "../theme";
import type { CalendarEvent, ResolvedConfig } from "../types";
import { useAppIsRTL } from "./useAppIsRTL";

export interface EventMover<E extends CalendarEvent = CalendarEvent> {
  /** `draggable` allows this event and `onEventDrop` is set. */
  canMove: (event: E) => boolean;
  /** Reports `event` moved by `days` and `minutes` (no-op for 0, 0). */
  move: (event: E, days: number, minutes: number) => void;
  /** Minutes per step in time grids. */
  snapMinutes: number;
  /** Day columns and cells run right to left on screen. */
  reversed: boolean;
}

/** `undefined` when nothing can move (not draggable, or a neighbour page). */
export function useEventMover<E extends CalendarEvent>(
  cfg: ResolvedConfig<E>,
  view: ECalendarViewType,
): EventMover<E> | undefined {
  const { draggable, onEventDrop, dragSnapMinutes } = cfg;
  const current = useIsCurrentPage();
  const { flip } = useCalendarTheme();
  const appIsRTL = useAppIsRTL();
  const enabled = current && Boolean(draggable) && Boolean(onEventDrop);

  const canMove = useCallback(
    (event: E) =>
      typeof draggable === "function" ? draggable(event) : draggable === true,
    [draggable],
  );
  const move = useCallback(
    (event: E, days: number, minutes: number) => {
      if (!onEventDrop || (days === 0 && minutes === 0)) return;
      const { start, end } = moveEvent(
        dateFn(event.startDate),
        event.endDate ? dateFn(event.endDate) : undefined,
        days,
        minutes,
      );
      onEventDrop({
        event,
        start: start.toJSDate(),
        end: end.toJSDate(),
        allDay: !event.startDate.includes("T"),
        view,
      });
    },
    [onEventDrop, view],
  );

  return useMemo(
    () =>
      enabled
        ? {
            canMove,
            move,
            snapMinutes: dragSnapMinutes,
            reversed: flip !== appIsRTL,
          }
        : undefined,
    [enabled, canMove, move, dragSnapMinutes, flip, appIsRTL],
  );
}
