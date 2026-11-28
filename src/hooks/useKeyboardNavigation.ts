/**
 * @file Web keyboard navigation (`keyboardNavigation`): reads keydown events
 * and handles the period keys of the time grids and Schedule. The month
 * grid's roving focus lives in `MonthView`; the rules are in core.
 */
import { useCallback } from "react";
import { Platform } from "react-native";
import { dateFn, getPeriodKeyAction, type KeyInput } from "../core";
import { useIsCurrentPage } from "../context/LayoutContext";
import { useCalendarTheme } from "../theme";
import { useNavigate } from "./useNavigate";

/** A keydown event as react-native-web delivers it (the DOM event). */
export interface WebKeyEvent {
  nativeEvent: KeyInput & { target?: unknown };
  currentTarget?: unknown;
  preventDefault: () => void;
}

/** The minimal DOM element surface used here (the library has no DOM lib). */
interface DomElement {
  tagName?: string;
  isContentEditable?: boolean;
  focus?: (options?: { preventScroll?: boolean }) => void;
  scrollIntoView?: (options: { block: "nearest" }) => void;
  querySelectorAll?: (selector: string) => ArrayLike<DomElement>;
}

/**
 * True when keyboard navigation applies here: on web, with
 * `keyboardNavigation`, on the current pager page.
 */
export function useKeyboardEnabled(keyboardNavigation: boolean): boolean {
  const current = useIsCurrentPage();
  return Platform.OS === "web" && keyboardNavigation && current;
}

/** The key, or `null` while typing in a field (custom renderers' inputs). */
export function readKey(e: WebKeyEvent): KeyInput | null {
  const target = e.nativeEvent.target as DomElement | undefined;
  const tag = target?.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target?.isContentEditable
  )
    return null;
  return e.nativeEvent;
}

/**
 * Moves focus to the previous or next row button inside the list (DOM order:
 * the rows react-native-web has rendered). Returns false at either end.
 */
export function moveRowFocus(e: WebKeyEvent, direction: 1 | -1): boolean {
  const list = e.currentTarget as DomElement | undefined;
  const from = e.nativeEvent.target as DomElement | undefined;
  const rows = Array.from(
    list?.querySelectorAll?.('[role="button"][tabindex="0"]') ?? [],
  );
  const index = rows.findIndex((r) => r === from);
  const next = rows[index === -1 ? 0 : index + direction];
  if (!next) return false;
  next.focus?.();
  next.scrollIntoView?.({ block: "nearest" });
  return true;
}

/**
 * `onKeyDown` for the time grids (`arrows`: ← / → turn the period) and
 * Schedule (`rows`: ↑ / ↓ move between rows); `undefined` when keyboard
 * navigation is off, so native trees are unchanged. Give the element that
 * takes it `tabIndex={-1}`: a period key moves focus there.
 */
export function usePeriodKeys(
  keyboardNavigation: boolean,
  options: { arrows: boolean; rows?: boolean; pages?: boolean },
): ((e: WebKeyEvent) => void) | undefined {
  const enabled = useKeyboardEnabled(keyboardNavigation);
  const navigate = useNavigate();
  const { flip } = useCalendarTheme();
  const { arrows, rows = false, pages = true } = options;
  const onKeyDown = useCallback(
    (e: WebKeyEvent) => {
      const key = readKey(e);
      if (!key) return;
      if (rows && (key.key === "ArrowDown" || key.key === "ArrowUp")) {
        if (moveRowFocus(e, key.key === "ArrowDown" ? 1 : -1))
          e.preventDefault();
        return;
      }
      const action = getPeriodKeyAction(key, { flip, arrows, pages });
      if (action === null) return;
      e.preventDefault();
      navigate(action === "today" ? dateFn() : action);
      // The focused event or row may belong to the old period and unmount;
      // keep focus in the view (focusable by code, tabIndex -1) so the next
      // key still works.
      (e.currentTarget as DomElement | undefined)?.focus?.({
        preventScroll: true,
      });
    },
    [navigate, flip, arrows, rows, pages],
  );
  return enabled ? onKeyDown : undefined;
}
