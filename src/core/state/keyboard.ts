/**
 * @file Keyboard rules for the web (pure): which day a key moves the month
 * grid's focus to, and which keys turn the period in the other views.
 */
import type { DateType, WeekdayIndex } from "../types";

/** The parts of a keydown event the rules read. */
export interface KeyInput {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export interface MonthKeyOptions {
  weekStartsOn: WeekdayIndex;
  /** Last visible weekday (work weeks hide the rest). */
  weekEndsOn: WeekdayIndex;
  /** The calendar is mirrored (RTL): ← and → swap. */
  flip: boolean;
  /** Today, for the `T` key. */
  today: DateType;
}

/** `0` (Sunday) … `6` from a Luxon weekday (`1` Monday … `7` Sunday). */
const indexOf = (day: DateType) => (day.weekday % 7) as WeekdayIndex;

/** Days from `weekStartsOn` to `day`'s weekday (0–6). */
const fromStart = (day: DateType, start: WeekdayIndex) =>
  (indexOf(day) - start + 7) % 7;

/** True when `day`'s weekday is a column of the grid. */
export function isVisibleWeekday(
  day: DateType,
  weekStartsOn: WeekdayIndex,
  weekEndsOn: WeekdayIndex,
): boolean {
  return fromStart(day, weekStartsOn) <= (weekEndsOn - weekStartsOn + 7) % 7;
}

/** A modifier other than Shift means the key belongs to the browser. */
const hasCommandModifier = (k: KeyInput) =>
  k.ctrlKey === true || k.metaKey === true || k.altKey === true;

/**
 * The day the month grid's focus moves to for `key`, or `null` when the key
 * is not a grid key.
 *
 * - ← / →: one visible day (swapped when `flip`), skipping hidden weekdays
 * - ↑ / ↓: one week
 * - Home / End: first / last visible day of the week row
 * - PageUp / PageDown: one month (Shift: one year), same day or the month's last
 * - T: today
 */
export function getMonthKeyTarget(
  input: KeyInput,
  day: DateType,
  options: MonthKeyOptions,
): DateType | null {
  if (hasCommandModifier(input)) return null;
  const { weekStartsOn, weekEndsOn, flip, today } = options;
  const span = (weekEndsOn - weekStartsOn + 7) % 7;
  const step = (direction: 1 | -1) => {
    let next = day;
    for (let i = 0; i < 7; i++) {
      next = next.plus({ days: direction });
      if (isVisibleWeekday(next, weekStartsOn, weekEndsOn)) return next;
    }
    return day.plus({ days: direction });
  };
  const rowStart = () => day.minus({ days: fromStart(day, weekStartsOn) });

  switch (input.key) {
    case "ArrowLeft":
      return step(flip ? 1 : -1);
    case "ArrowRight":
      return step(flip ? -1 : 1);
    case "ArrowUp":
      return day.minus({ weeks: 1 });
    case "ArrowDown":
      return day.plus({ weeks: 1 });
    case "Home":
      return rowStart();
    case "End":
      return rowStart().plus({ days: span });
    case "PageUp":
      return input.shiftKey
        ? day.minus({ years: 1 })
        : day.minus({ months: 1 });
    case "PageDown":
      return input.shiftKey ? day.plus({ years: 1 }) : day.plus({ months: 1 });
    case "t":
    case "T":
      return today.startOf("day");
    default:
      return null;
  }
}

/** What a key does in the time grids and Schedule. */
export type PeriodKeyAction = 1 | -1 | "today" | null;

/**
 * Period keys outside the month grid: PageUp / PageDown and, when `arrows`
 * (time grids), ← / → turn the period; T goes to today.
 */
export function getPeriodKeyAction(
  input: KeyInput,
  options: { flip: boolean; arrows: boolean },
): PeriodKeyAction {
  if (hasCommandModifier(input) || input.shiftKey) return null;
  switch (input.key) {
    case "PageUp":
      return -1;
    case "PageDown":
      return 1;
    case "ArrowLeft":
      return options.arrows ? (options.flip ? 1 : -1) : null;
    case "ArrowRight":
      return options.arrows ? (options.flip ? -1 : 1) : null;
    case "t":
    case "T":
      return "today";
    default:
      return null;
  }
}

/** What an event can do with the keyboard (web), from its drag setup. */
export interface EventKeyOptions {
  /** It can be moved; `stepMinutes` > 0 moves in time grids by minutes. */
  move?: { stepMinutes: number; rowDays?: number; reversed?: boolean };
  /** Its bottom edge can be resized, by this many minutes. */
  resizeMinutes?: number;
}

/** A keyboard move (days, minutes) or bottom-edge resize (minutes). */
export type EventKeyAction =
  | { type: "move"; days: number; minutes: number }
  | { type: "resize"; minutes: number };

/**
 * The move or resize for a key on a focused event, or `null` (calendar-simple
 * keys): Alt+←/→ a day (mirrored when columns run right to left), Alt+↑/↓
 * one time step (time grids) or `rowDays` days (Month: a week),
 * Alt+Shift+↑/↓ the end by `resizeMinutes`.
 */
export function getEventKeyAction(
  input: KeyInput,
  options: EventKeyOptions,
): EventKeyAction | null {
  if (input.altKey !== true || input.ctrlKey || input.metaKey) return null;
  const up = input.key === "ArrowUp";
  const down = input.key === "ArrowDown";
  if (input.shiftKey) {
    const r = options.resizeMinutes;
    if (!r || !(up || down)) return null;
    return { type: "resize", minutes: up ? -r : r };
  }
  const m = options.move;
  if (!m) return null;
  if (input.key === "ArrowLeft" || input.key === "ArrowRight") {
    const later = (input.key === "ArrowRight") !== (m.reversed === true);
    return { type: "move", days: later ? 1 : -1, minutes: 0 };
  }
  if (!(up || down)) return null;
  const sign = up ? -1 : 1;
  if (m.stepMinutes > 0)
    return { type: "move", days: 0, minutes: sign * m.stepMinutes };
  if (m.rowDays) return { type: "move", days: sign * m.rowDays, minutes: 0 };
  return null;
}

/** `aria-keyshortcuts` for an event with `options`, or `undefined`. */
export function getEventKeyShortcuts(
  options: EventKeyOptions,
): string | undefined {
  const list: string[] = [];
  const m = options.move;
  if (m && (m.stepMinutes > 0 || m.rowDays))
    list.push("Alt+ArrowUp", "Alt+ArrowDown");
  if (m) list.push("Alt+ArrowLeft", "Alt+ArrowRight");
  if (options.resizeMinutes)
    list.push("Alt+Shift+ArrowUp", "Alt+Shift+ArrowDown");
  return list.length ? list.join(" ") : undefined;
}
