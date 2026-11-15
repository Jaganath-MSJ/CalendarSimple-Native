/**
 * @file Demo events for every month: the hand-made October 2026 set plus
 * generated weeks around it, so swiping to any nearby month, week or day
 * shows events.
 *
 * Generation is seeded by each week's start date, so a week always gets the
 * same events whatever the range or the day the app opens. October 2026
 * keeps only the hand-made prototype set, which the week, day and 3-day
 * screenshots and the Maestro flows rely on.
 */
import { DateTime } from "luxon";
import type { CalendarEvent } from "../../../src";
import { OCT_2026_EVENTS } from "../../../src/core/test/fixtures";

/** The date the example screens open on. */
export const DEMO_DATE = new Date(2026, 9, 22);

/** Days that keep only the hand-made set (inclusive ISO dates). */
const HAND_MADE = { from: "2026-10-01", to: "2026-10-31" };

const COLORS = [undefined, "#c2410c", "#7e22ce", "#15803d", "#0369a1"];
const TIMED = [
  "Standup",
  "1:1 with Sam",
  "Design review",
  "Customer call",
  "Lunch with Priya",
  "Gym",
  "Code review",
  "Product sync",
  "Interview",
  "Dentist",
  "Coffee chat",
  "Retro",
];
const ALL_DAY = [
  "Payroll",
  "Release day",
  "Birthday",
  "Public holiday",
  "Deadline",
];
const MULTI_DAY = ["Conference", "Trip to Lisbon", "On call", "Team offsite"];
const DURATIONS = [30, 45, 60, 60, 90, 120];

/** A small seeded random generator (mulberry32). */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 32-bit hash of a string (FNV-1a). */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function pick<T>(list: readonly T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)] as T;
}

const DAY = "yyyy-MM-dd";
const TIME = "yyyy-MM-dd'T'HH:mm:00";

function overlapsHandMade(start: DateTime, end: DateTime): boolean {
  return (
    start.toFormat(DAY) <= HAND_MADE.to && end.toFormat(DAY) >= HAND_MADE.from
  );
}

function colored(
  event: CalendarEvent,
  color: string | undefined,
): CalendarEvent {
  return color ? { ...event, style: { backgroundColor: color } } : event;
}

/** The generated events of the ISO week starting on `monday`. */
function weekEvents(monday: DateTime): CalendarEvent[] {
  const key = monday.toFormat(DAY);
  const rand = random(hash(key));
  const out: CalendarEvent[] = [];
  let n = 0;
  const id = () => `demo-${key}-${n++}`;

  // 3–6 timed events, mostly on weekdays; the second overlaps the first.
  const count = 3 + Math.floor(rand() * 4);
  let previous: DateTime | undefined;
  for (let i = 0; i < count; i++) {
    const start =
      i === 1 && previous
        ? previous.plus({ minutes: 30 })
        : monday
            .plus({ days: Math.floor(rand() * (rand() < 0.85 ? 5 : 7)) })
            .set({
              hour: 8 + Math.floor(rand() * 10),
              minute: rand() < 0.5 ? 0 : 30,
            });
    const end = start.plus({ minutes: pick(DURATIONS, rand) });
    previous = start;
    out.push(
      colored(
        {
          id: id(),
          title: pick(TIMED, rand),
          startDate: start.toFormat(TIME),
          endDate: end.toFormat(TIME),
        },
        pick(COLORS, rand),
      ),
    );
  }

  // One all-day event.
  out.push(
    colored(
      {
        id: id(),
        title: pick(ALL_DAY, rand),
        startDate: monday.plus({ days: Math.floor(rand() * 7) }).toFormat(DAY),
      },
      pick(COLORS, rand),
    ),
  );

  // A 2–4 day event every other week.
  if (monday.weekNumber % 2 === 0) {
    const start = monday.plus({ days: Math.floor(rand() * 4) });
    out.push(
      colored(
        {
          id: id(),
          title: pick(MULTI_DAY, rand),
          startDate: start.toFormat(DAY),
          endDate: start
            .plus({ days: 1 + Math.floor(rand() * 3) })
            .toFormat(DAY),
        },
        pick(COLORS.slice(1), rand),
      ),
    );
  }
  return out;
}

/**
 * Demo events from `from` to `to` (inclusive, by week): generated weeks, one
 * event per month ending at exactly 00:00 (the 15th, 22:00–00:00), and the
 * hand-made October 2026 set.
 */
export function buildDemoEvents(from: Date, to: Date): CalendarEvent[] {
  const first = DateTime.fromJSDate(from).startOf("week");
  const last = DateTime.fromJSDate(to).endOf("day");
  const out: CalendarEvent[] = [];

  for (let monday = first; monday <= last; monday = monday.plus({ weeks: 1 })) {
    for (const event of weekEvents(monday)) {
      const start = DateTime.fromISO(event.startDate);
      const end = event.endDate ? DateTime.fromISO(event.endDate) : start;
      if (!overlapsHandMade(start, end)) out.push(event);
    }
  }

  for (
    let month = first.startOf("month");
    month <= last;
    month = month.plus({ months: 1 })
  ) {
    const start = month.set({ day: 15, hour: 22 });
    const end = start.plus({ hours: 2 });
    if (start < first || start > last || overlapsHandMade(start, end)) continue;
    out.push({
      id: `demo-midnight-${month.toFormat("yyyy-MM")}`,
      title: "Late deploy",
      startDate: start.toFormat(TIME),
      endDate: end.toFormat(TIME),
    });
  }

  return [...(OCT_2026_EVENTS as CalendarEvent[]), ...out];
}

const now = new Date();
const earliest = Math.min(DEMO_DATE.getTime(), now.getTime());
const latest = Math.max(DEMO_DATE.getTime(), now.getTime());

/**
 * The example's shared data: 6 months before the earlier of {@link DEMO_DATE}
 * and today, to 12 months after the later of the two.
 */
export const DEMO_EVENTS: CalendarEvent[] = buildDemoEvents(
  DateTime.fromMillis(earliest).minus({ months: 6 }).toJSDate(),
  DateTime.fromMillis(latest).plus({ months: 12 }).toJSDate(),
);
