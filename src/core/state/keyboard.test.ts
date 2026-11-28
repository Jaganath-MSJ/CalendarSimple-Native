import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  getEventKeyAction,
  getEventKeyShortcuts,
  getMonthKeyTarget,
  getPeriodKeyAction,
  isVisibleWeekday,
  type KeyInput,
  type MonthKeyOptions,
} from "./keyboard";

// Thursday 22 Oct 2026.
const day = DateTime.fromISO("2026-10-22");
const today = DateTime.fromISO("2026-11-16T09:30:00");
const opts: MonthKeyOptions = {
  weekStartsOn: 0,
  weekEndsOn: 6,
  flip: false,
  today,
};
const go = (key: string, o: Partial<MonthKeyOptions> = {}, shiftKey = false) =>
  getMonthKeyTarget({ key, shiftKey }, day, { ...opts, ...o })?.toISODate();

describe("getMonthKeyTarget", () => {
  it.each([
    ["ArrowLeft", "2026-10-21"],
    ["ArrowRight", "2026-10-23"],
    ["ArrowUp", "2026-10-15"],
    ["ArrowDown", "2026-10-29"],
    ["Home", "2026-10-18"],
    ["End", "2026-10-24"],
    ["PageUp", "2026-09-22"],
    ["PageDown", "2026-11-22"],
    ["t", "2026-11-16"],
    ["T", "2026-11-16"],
  ])("%s moves to %s", (key, expected) => expect(go(key)).toBe(expected));

  it("Shift+PageUp / PageDown move a year", () => {
    expect(go("PageUp", {}, true)).toBe("2025-10-22");
    expect(go("PageDown", {}, true)).toBe("2027-10-22");
  });

  it("swaps ← and → when mirrored", () => {
    expect(go("ArrowLeft", { flip: true })).toBe("2026-10-23");
    expect(go("ArrowRight", { flip: true })).toBe("2026-10-21");
  });

  it("follows weekStartsOn for Home and End", () => {
    expect(go("Home", { weekStartsOn: 1, weekEndsOn: 0 })).toBe("2026-10-19");
    expect(go("End", { weekStartsOn: 1, weekEndsOn: 0 })).toBe("2026-10-25");
    expect(go("Home", { weekStartsOn: 6, weekEndsOn: 5 })).toBe("2026-10-17");
  });

  it("skips hidden weekdays in a work week", () => {
    const fri = DateTime.fromISO("2026-10-23");
    const mon = DateTime.fromISO("2026-10-26");
    const work = { ...opts, weekStartsOn: 1, weekEndsOn: 5 } as const;
    expect(
      getMonthKeyTarget({ key: "ArrowRight" }, fri, work)?.toISODate(),
    ).toBe("2026-10-26");
    expect(
      getMonthKeyTarget({ key: "ArrowLeft" }, mon, work)?.toISODate(),
    ).toBe("2026-10-23");
    expect(go("End", { weekStartsOn: 1, weekEndsOn: 5 })).toBe("2026-10-23");
  });

  it("clamps PageDown to the end of a shorter month", () => {
    const jan31 = DateTime.fromISO("2026-01-31");
    expect(
      getMonthKeyTarget({ key: "PageDown" }, jan31, opts)?.toISODate(),
    ).toBe("2026-02-28");
  });

  it("ignores other keys and browser shortcuts", () => {
    expect(go("a")).toBeUndefined();
    expect(go("Enter")).toBeUndefined();
    expect(
      getMonthKeyTarget({ key: "ArrowLeft", metaKey: true }, day, opts),
    ).toBeNull();
    expect(
      getMonthKeyTarget({ key: "t", ctrlKey: true }, day, opts),
    ).toBeNull();
  });
});

describe("isVisibleWeekday", () => {
  it("covers the wrapped range", () => {
    const sat = DateTime.fromISO("2026-10-24");
    expect(isVisibleWeekday(sat, 1, 5)).toBe(false);
    expect(isVisibleWeekday(sat, 6, 1)).toBe(true);
  });
});

describe("getPeriodKeyAction", () => {
  const grid = { flip: false, arrows: true };
  it("maps period keys", () => {
    expect(getPeriodKeyAction({ key: "PageUp" }, grid)).toBe(-1);
    expect(getPeriodKeyAction({ key: "PageDown" }, grid)).toBe(1);
    expect(getPeriodKeyAction({ key: "ArrowLeft" }, grid)).toBe(-1);
    expect(getPeriodKeyAction({ key: "ArrowRight" }, grid)).toBe(1);
    expect(getPeriodKeyAction({ key: "T" }, grid)).toBe("today");
  });

  it("swaps arrows when mirrored and skips them in Schedule", () => {
    expect(
      getPeriodKeyAction({ key: "ArrowLeft" }, { flip: true, arrows: true }),
    ).toBe(1);
    expect(
      getPeriodKeyAction({ key: "ArrowLeft" }, { flip: false, arrows: false }),
    ).toBeNull();
  });

  it("ignores modifiers and other keys", () => {
    expect(
      getPeriodKeyAction({ key: "PageUp", shiftKey: true }, grid),
    ).toBeNull();
    expect(
      getPeriodKeyAction({ key: "ArrowLeft", altKey: true }, grid),
    ).toBeNull();
    expect(getPeriodKeyAction({ key: "ArrowUp" }, grid)).toBeNull();
  });
});

describe("getEventKeyAction (calendar-simple event keys)", () => {
  const grid = { move: { stepMinutes: 15 }, resizeMinutes: 30 };
  const k = (key: string, mods: Partial<KeyInput> = {}) => ({
    key,
    altKey: true,
    ...mods,
  });
  it("time grids: Alt+arrows move by days and minutes", () => {
    expect(getEventKeyAction(k("ArrowUp"), grid)).toEqual({
      type: "move",
      days: 0,
      minutes: -15,
    });
    expect(getEventKeyAction(k("ArrowDown"), grid)).toEqual({
      type: "move",
      days: 0,
      minutes: 15,
    });
    expect(getEventKeyAction(k("ArrowRight"), grid)).toEqual({
      type: "move",
      days: 1,
      minutes: 0,
    });
    expect(getEventKeyAction(k("ArrowLeft"), grid)).toEqual({
      type: "move",
      days: -1,
      minutes: 0,
    });
  });
  it("Alt+Shift+↑/↓ resizes the end", () => {
    expect(getEventKeyAction(k("ArrowDown", { shiftKey: true }), grid)).toEqual(
      { type: "resize", minutes: 30 },
    );
    expect(
      getEventKeyAction(k("ArrowUp", { shiftKey: true }), {
        move: { stepMinutes: 15 },
      }),
    ).toBeNull();
  });
  it("Month: ↑/↓ move by a week; right to left mirrors ←/→", () => {
    const month = { move: { stepMinutes: 0, rowDays: 7, reversed: true } };
    expect(getEventKeyAction(k("ArrowUp"), month)).toEqual({
      type: "move",
      days: -7,
      minutes: 0,
    });
    expect(getEventKeyAction(k("ArrowRight"), month)).toEqual({
      type: "move",
      days: -1,
      minutes: 0,
    });
  });
  it("all-day row: only ←/→; nothing without Alt or with Ctrl/⌘", () => {
    const row = { move: { stepMinutes: 0 } };
    expect(getEventKeyAction(k("ArrowUp"), row)).toBeNull();
    expect(getEventKeyAction({ key: "ArrowRight" }, grid)).toBeNull();
    expect(
      getEventKeyAction(k("ArrowRight", { metaKey: true }), grid),
    ).toBeNull();
  });
  it("lists the shortcuts", () => {
    expect(getEventKeyShortcuts(grid)).toBe(
      "Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowUp Alt+Shift+ArrowDown",
    );
    expect(getEventKeyShortcuts({ move: { stepMinutes: 0 } })).toBe(
      "Alt+ArrowLeft Alt+ArrowRight",
    );
    expect(getEventKeyShortcuts({})).toBeUndefined();
  });
});
