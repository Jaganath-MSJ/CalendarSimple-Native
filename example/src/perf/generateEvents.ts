/**
 * @file Deterministic event sets for the performance screen (P9.S4).
 */
import type { CalendarEvent } from "../../../src";
import type { DateType } from "../../../src/core";

/** mulberry32: a small seeded PRNG, so a seed always gives the same events. */
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

const COLOURS = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"];
/** Events land within ±SPREAD days of `around`. */
const SPREAD = 45;

/**
 * `count` events around `around`: 70 % timed same-day (15 min to 3 h,
 * 07:00–20:00), 20 % all-day, 10 % multi-day (2–5 days). Same `seed`, same
 * events.
 */
export function generateEvents(
  count: number,
  seed: number,
  around: DateType,
): CalendarEvent[] {
  const next = rng(seed);
  const int = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));
  const base = around.startOf("day");
  return Array.from({ length: count }, (_, i) => {
    const day = base.plus({ days: int(-SPREAD, SPREAD) });
    const kind = next();
    const style = { backgroundColor: COLOURS[i % COLOURS.length]! };
    const id = `p${i}`;
    if (kind < 0.7) {
      const start = day.set({ hour: int(7, 19), minute: int(0, 3) * 15 });
      const end = start.plus({ minutes: int(1, 12) * 15 });
      return {
        id,
        title: `Timed ${i}`,
        startDate: start.toISO({ includeOffset: false })!,
        endDate: end.toISO({ includeOffset: false })!,
        style,
      };
    }
    if (kind < 0.9) {
      return { id, title: `All day ${i}`, startDate: day.toISODate()!, style };
    }
    return {
      id,
      title: `Multi-day ${i}`,
      startDate: day.toISODate()!,
      endDate: day.plus({ days: int(1, 4) }).toISODate()!,
      style,
    };
  });
}
