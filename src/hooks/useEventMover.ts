/**
 * @file Moving and resizing events (`draggable` / `onEventDrop`,
 * `resizable` / `onEventResize`): which events may change, and the callbacks
 * with their new times. Used by the gestures entry and by the screen-reader
 * actions.
 */
import { useCallback, useMemo } from "react";
import {
  dateFn,
  moveEvent,
  resizeEvent,
  type ECalendarViewType,
  type ResizeEdge,
} from "../core";
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
  /** `resizable` allows this timed event and `onEventResize` is set. */
  canResize: (event: E) => boolean;
  /** Reports `event`'s `edge` moved by `minutes` (no-op for 0). */
  resize: (event: E, edge: ResizeEdge, minutes: number) => void;
  /** Minutes per resize step. */
  resizeMinutes: number;
  /** Day columns and cells run right to left on screen. */
  reversed: boolean;
}

/** `undefined` when nothing can change (props off, or a neighbour page). */
export function useEventMover<E extends CalendarEvent>(
  cfg: ResolvedConfig<E>,
  view: ECalendarViewType,
): EventMover<E> | undefined {
  const {
    draggable,
    onEventDrop,
    dragSnapMinutes,
    resizable,
    onEventResize,
    resizeSnapMinutes,
    minEventDurationMinutes,
  } = cfg;
  const current = useIsCurrentPage();
  const { flip } = useCalendarTheme();
  const appIsRTL = useAppIsRTL();
  const moving = Boolean(draggable) && Boolean(onEventDrop);
  const resizing = Boolean(resizable) && Boolean(onEventResize);
  const enabled = current && (moving || resizing);

  const canMove = useCallback(
    (event: E) =>
      moving &&
      (typeof draggable === "function" ? draggable(event) : draggable === true),
    [moving, draggable],
  );
  const canResize = useCallback(
    (event: E) =>
      resizing &&
      event.startDate.includes("T") &&
      (typeof resizable === "function" ? resizable(event) : resizable === true),
    [resizing, resizable],
  );
  const resize = useCallback(
    (event: E, edge: ResizeEdge, minutes: number) => {
      if (!onEventResize || minutes === 0) return;
      const { start, end } = resizeEvent(
        dateFn(event.startDate),
        event.endDate ? dateFn(event.endDate) : undefined,
        edge,
        minutes,
        minEventDurationMinutes,
      );
      onEventResize({
        event,
        start: start.toJSDate(),
        end: end.toJSDate(),
        edge,
        view,
      });
    },
    [onEventResize, minEventDurationMinutes, view],
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
            canResize,
            resize,
            resizeMinutes: resizeSnapMinutes,
            reversed: flip !== appIsRTL,
          }
        : undefined,
    [
      enabled,
      canMove,
      move,
      dragSnapMinutes,
      canResize,
      resize,
      resizeSnapMinutes,
      flip,
      appIsRTL,
    ],
  );
}
