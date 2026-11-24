import { describe, it, expect } from "vitest";
import { getVisibleRange } from "./visibleRange";
import { dateFn } from "../utils/date";
import type { ECalendarViewType } from "../types";

const o = {
  weekStartsOn: 0,
  weekEndsOn: 6,
  customDays: 3,
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
  it("schedule spans every event (calendar-simple)", () => {
    const events = [
      {
        title: "B",
        startDate: "2026-12-01T09:00:00",
        endDate: "2026-12-03T10:00:00",
      },
      { title: "A", startDate: "2026-09-05" },
      { title: "C", startDate: "2026-11-10", endDate: "2026-11-12" },
    ];
    // First event's start day to the last event's last day.
    expect(r("schedule", "2026-10-22", { events })).toEqual([
      "2026-09-05",
      "2026-12-03",
    ]);
    // No events: the selected day.
    expect(r("schedule", "2026-10-22", { events: [] })).toEqual([
      "2026-10-22",
      "2026-10-22",
    ]);
  });
});
