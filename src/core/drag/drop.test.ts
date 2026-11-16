import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import {
  cellsMoved,
  getAxisBounds,
  moveEvent,
  resizeEvent,
  stepsMoved,
} from "./drop";

describe("getAxisBounds", () => {
  it("lets a cell move to every other cell of the row", () => {
    expect(getAxisBounds(0, 7, 50)).toEqual({ min: -0, max: 300 });
    expect(getAxisBounds(3, 7, 50)).toEqual({ min: -150, max: 150 });
    expect(getAxisBounds(6, 7, 50)).toEqual({ min: -300, max: 0 });
  });

  it("mirrors when the row is reversed on screen", () => {
    expect(getAxisBounds(0, 7, 50, true)).toEqual({ min: -300, max: 0 });
    expect(getAxisBounds(6, 7, 50, true)).toEqual({ min: -0, max: 300 });
  });
});

describe("cellsMoved / stepsMoved", () => {
  it("rounds to whole cells, in logical order", () => {
    expect(cellsMoved(74, 50)).toBe(1);
    expect(cellsMoved(76, 50)).toBe(2);
    expect(cellsMoved(-50, 50)).toBe(-1);
    expect(cellsMoved(100, 50, true)).toBe(-2);
    expect(cellsMoved(10, 0)).toBe(0);
    expect(cellsMoved(-10, 50)).toBe(0);
  });

  it("rounds to whole steps", () => {
    expect(stepsMoved(15, 15)).toBe(1);
    expect(stepsMoved(-44, 15)).toBe(-3);
    expect(stepsMoved(30, 0)).toBe(0);
  });
});

describe("moveEvent", () => {
  const start = DateTime.fromISO("2026-10-22T09:00:00");
  const end = DateTime.fromISO("2026-10-22T10:30:00");

  it("moves both ends by days and minutes", () => {
    const r = moveEvent(start, end, 1, 45);
    expect(r.start.toISO()).toContain("2026-10-23T09:45");
    expect(r.end.toISO()).toContain("2026-10-23T11:15");
  });

  it("ends at the start when there is no end", () => {
    const r = moveEvent(start, undefined, -2, 0);
    expect(r.end.toMillis()).toBe(r.start.toMillis());
    expect(r.start.toISODate()).toBe("2026-10-20");
  });
});

describe("resizeEvent", () => {
  const start = DateTime.fromISO("2026-10-22T09:00:00");
  const end = DateTime.fromISO("2026-10-22T10:00:00");
  const hm = (d: DateTime) => d.toFormat("HH:mm");

  it("moves the bottom edge", () => {
    const r = resizeEvent(start, end, "bottom", 30, 15);
    expect([hm(r.start), hm(r.end)]).toEqual(["09:00", "10:30"]);
  });

  it("moves the top edge", () => {
    const r = resizeEvent(start, end, "top", -45, 15);
    expect([hm(r.start), hm(r.end)]).toEqual(["08:15", "10:00"]);
  });

  it("keeps the minimum length", () => {
    expect(hm(resizeEvent(start, end, "bottom", -120, 15).end)).toBe("09:15");
    expect(hm(resizeEvent(start, end, "top", 120, 30).start)).toBe("09:30");
  });

  it("grows an event without an end from its start", () => {
    const r = resizeEvent(start, undefined, "bottom", 45, 15);
    expect([hm(r.start), hm(r.end)]).toEqual(["09:00", "09:45"]);
    expect(hm(resizeEvent(start, undefined, "bottom", 0, 15).end)).toBe(
      "09:15",
    );
  });
});
