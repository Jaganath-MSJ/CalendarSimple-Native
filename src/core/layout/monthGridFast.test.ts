/**
 * Guards for the day-ordinal `buildMonthGrid`: identical output to the
 * bada251 implementation, and Luxon parsing that grows with the event count
 * only (not events × weeks × days, which cost ~1.5 s per page on Hermes).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTime } from "luxon";
import { buildMonthGrid, type MonthGridOptions } from "./monthGrid";
import { buildMonthGridReference } from "../test/monthGridReference";
import { freezeNow, restoreNow, withZone } from "../test/clock";
import type { BaseCalendarEvent, CalendarMatrix } from "../types";

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Timed, all-day, multi-day, midnight-ending, zero, negative and invalid events. */
function events(count: number, seed: number, around: string) {
  const next = rng(seed);
  const int = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));
  const base = DateTime.fromISO(around);
  const out: BaseCalendarEvent[] = [];
  for (let i = 0; i < count; i++) {
    const day = base.plus({ days: int(-45, 45) });
    const k = next();
    const title = i % 7 === 0 ? "Same" : `E${i}`;
    if (k < 0.5) {
      const s = day.set({ hour: int(0, 22), minute: int(0, 3) * 15 });
      out.push({
        id: `t${i}`,
        title,
        startDate: s.toISO()!,
        endDate: s.plus({ minutes: int(0, 300) }).toISO()!,
      });
    } else if (k < 0.7) {
      out.push({
        id: `a${i}`,
        title,
        startDate: day.toISODate()!,
        endDate: i % 3 ? day.plus({ days: int(0, 3) }).toISODate()! : undefined,
      });
    } else if (k < 0.85) {
      const s = day.set({ hour: int(8, 20) });
      out.push({
        title,
        startDate: s.toISO()!,
        endDate: s
          .plus({ days: int(1, 9) })
          .startOf("day")
          .toISO()!,
      });
    } else if (k < 0.95) {
      out.push({
        title,
        startDate: day.set({ hour: 22 }).toISO()!,
        endDate: day.plus({ days: 1, hours: 2 }).toISO()!,
      });
    } else if (k < 0.98) {
      out.push({ title, startDate: day.toISO()!, endDate: day.toISO()! });
    } else {
      out.push({
        title,
        startDate: day.toISO()!,
        endDate: day.minus({ days: 2 }).toISO()!,
      });
    }
  }
  return out;
}

function plain(m: CalendarMatrix<BaseCalendarEvent>) {
  return m.map((w) =>
    w.map((d) => ({ ...d, currentDate: d.currentDate.toISO() })),
  );
}

const cases: [string, MonthGridOptions][] = [
  ["defaults", {}],
  ["eventsAreSorted", { eventsAreSorted: true }],
  ["no ordering", { isEventOrderingEnabled: false }],
  ["unsorted", { sortedMonthView: false }],
  [
    "custom sort",
    {
      sortedMonthView: (a: BaseCalendarEvent, b: BaseCalendarEvent) =>
        a.title.localeCompare(b.title),
    },
  ],
];

afterEach(() => restoreNow());

describe("buildMonthGrid matches the reference implementation", () => {
  for (const zone of ["America/New_York", "Asia/Kolkata", "Europe/London"]) {
    for (const [name, options] of cases) {
      it(
        `${zone}, ${name}`,
        () =>
          withZone(zone, () => {
            freezeNow("2026-11-02T09:00:00");
            for (const [month, seed] of [
              ["2026-03-10", 1],
              ["2026-11-01", 2],
              ["2026-10-22", 3],
            ] as const) {
              const list = events(150, seed, month);
              for (const [ws, we] of [
                [0, 6],
                [1, 0],
                [6, 5],
                [1, 5],
              ] as const) {
                const d = DateTime.fromISO(month);
                expect(plain(buildMonthGrid(d, list, ws, we, options))).toEqual(
                  plain(buildMonthGridReference(d, list, ws, we, options)),
                );
              }
            }
          }),
        30_000,
      );
    }
  }

  it("enriched events", () => {
    const list = events(120, 9, "2026-10-15");
    const byDate: Record<string, BaseCalendarEvent[]> = {};
    for (const e of list) {
      const k = e.startDate.slice(0, 10);
      (byDate[k] ??= []).push(e);
    }
    const d = DateTime.fromISO("2026-10-15");
    const options = {
      enableEnrichedEvents: true,
      enrichedEventsByDate: byDate,
    };
    expect(plain(buildMonthGrid(d, [], 0, 6, options))).toEqual(
      plain(buildMonthGridReference(d, [], 0, 6, options)),
    );
  });
});

describe("buildMonthGrid cost", () => {
  it("parses each event a bounded number of times", () => {
    const list = events(500, 7, "2026-10-22");
    const spy = vi.spyOn(DateTime, "fromISO");
    buildMonthGrid(DateTime.fromISO("2026-10-22"), list, 0, 6);
    const calls = spy.mock.calls.length;
    spy.mockRestore();
    // bada251 parsed ~70 times per event; the rewrite parses at most 3.
    expect(calls).toBeLessThanOrEqual(list.length * 3);
  });
});
