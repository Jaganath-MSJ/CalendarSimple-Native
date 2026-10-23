import { describe, it, expect } from "vitest";
import { getVisibleRange } from "./visibleRange";
import { dateFn } from "../utils/date";
import type { ECalendarViewType } from "../types";

const o = {
  weekStartsOn: 0,
  weekEndsOn: 6,
  customDays: 3,
  scheduleDays: 30,
  scheduleExtraDays: 0,
};
const r = (v: ECalendarViewType, iso: string, extra = {}) => {
  const x = getVisibleRange(v, dateFn(iso), { ...o, ...extra });
  return [x.start.toISODate(), x.end.toISODate()];
};

describe("getVisibleRange", () => {
  it("month includes adjacent cells", () =>
    expect(r("month", "2026-10-22")).toEqual(["2026-09-27", "2026-10-31"]));
  it("week aligns to weekStartsOn", () =>
    expect(r("week", "2026-10-22")).toEqual(["2026-10-18", "2026-10-24"]));
  it("Mon–Fri week", () =>
    expect(r("week", "2026-10-22", { weekStartsOn: 1, weekEndsOn: 5 })).toEqual(
      ["2026-10-19", "2026-10-23"],
    ));
  it("day", () =>
    expect(r("day", "2026-10-22")).toEqual(["2026-10-22", "2026-10-22"]));
  it("custom days", () =>
    expect(r("customDays", "2026-10-22")).toEqual([
      "2026-10-22",
      "2026-10-24",
    ]));
  it("schedule window grows with extra days (#6C)", () => {
    expect(r("schedule", "2026-10-22")).toEqual(["2026-10-22", "2026-11-20"]);
    expect(r("schedule", "2026-10-22", { scheduleExtraDays: 30 })).toEqual([
      "2026-10-22",
      "2026-12-20",
    ]);
  });
});
