import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { OCT_2026_EVENTS } from "../../../src/core/test/fixtures";
import { buildDemoEvents } from "./demoEvents";

const from = new Date(2026, 3, 1);
const to = new Date(2027, 10, 30);
const events = buildDemoEvents(from, to);

const startOf = (iso: string) => DateTime.fromISO(iso);

describe("buildDemoEvents", () => {
  it("gives every month in the range at least 10 events", () => {
    for (
      let month = DateTime.fromJSDate(from).startOf("month");
      month < DateTime.fromJSDate(to);
      month = month.plus({ months: 1 })
    ) {
      const inMonth = events.filter((e) =>
        startOf(e.startDate).hasSame(month, "month"),
      );
      expect(inMonth.length, month.toFormat("yyyy-MM")).toBeGreaterThanOrEqual(
        10,
      );
    }
  });

  it("uses unique ids", () => {
    const ids = events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps only the hand-made set in October 2026", () => {
    const inGrid = events.filter((e) => {
      const day = startOf(e.startDate).toFormat("yyyy-MM-dd");
      return day >= "2026-10-01" && day <= "2026-10-31";
    });
    expect(inGrid.map((e) => e.id).sort()).toEqual(
      OCT_2026_EVENTS.map((e) => e.id).sort(),
    );
  });

  it("is the same for a week whatever the range", () => {
    const narrow = buildDemoEvents(new Date(2027, 0, 4), new Date(2027, 0, 10));
    const week = events.filter((e) => e.id?.startsWith("demo-2027-01-04-"));
    expect(narrow.filter((e) => e.id?.startsWith("demo-2027-01-04-"))).toEqual(
      week,
    );
  });

  it("has timed, all-day, multi-day and midnight-ending events", () => {
    const generated = events.filter((e) => e.id?.startsWith("demo-"));
    expect(generated.some((e) => e.startDate.includes("T"))).toBe(true);
    expect(
      generated.some((e) => !e.startDate.includes("T") && !e.endDate),
    ).toBe(true);
    expect(generated.some((e) => !e.startDate.includes("T") && e.endDate)).toBe(
      true,
    );
    expect(generated.some((e) => e.endDate?.endsWith("T00:00:00"))).toBe(true);
  });

  it("ends every event after it starts", () => {
    for (const e of events)
      if (e.endDate)
        expect(startOf(e.endDate) >= startOf(e.startDate), `${e.id}`).toBe(
          true,
        );
  });
});
