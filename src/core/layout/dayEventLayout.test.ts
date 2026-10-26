import { describe, it, expect } from "vitest";
import { layoutDayEvents, type DayLayoutOptions } from "./dayEventLayout";
import { dateFn } from "../utils/date";
import type {
  BaseCalendarEvent as CalendarEvent,
  DateType,
  DayEventLayout,
} from "../types";
import { withZone } from "../test/clock";
import { OCT_2026_EVENTS } from "../test/fixtures";

// Web called `dayLayout(events, date, minHour, maxHour, showAllDayRow,
// offset, opts)` inside `renderHook`; these two helpers keep the ported
// assertions unchanged. A single date returns its inner array.
const renderHook = <T>(fn: () => T) => ({ result: { current: fn() } });
function dayLayout(
  events: CalendarEvent[],
  dateOrDates: DateType | DateType[],
  minHour: number,
  maxHour: number,
  showAllDayRow: boolean,
  eventOverlapOffset: number,
  opts: Partial<DayLayoutOptions<CalendarEvent>> = {},
): DayEventLayout[] | DayEventLayout[][] {
  const dates = Array.isArray(dateOrDates) ? dateOrDates : [dateOrDates];
  const out = layoutDayEvents(events, dates, {
    minHour,
    maxHour,
    showAllDayRow,
    eventOverlapOffset,
    ...opts,
  });
  return Array.isArray(dateOrDates) ? out : out[0]!;
}

describe("useDayEventLayout Hook", () => {
  const baseDate = dateFn("2024-03-01"); // March 1, 2024

  it("handles empty events without throwing", () => {
    const { result } = renderHook(() =>
      dayLayout([], baseDate, 0, 24, false, 0),
    );
    expect(result.current).toEqual([]);
  });

  it("filters events outside minHour and maxHour bounds", () => {
    const events: CalendarEvent[] = [
      {
        id: "1",
        title: "Early",
        startDate: "2024-03-01T06:00:00",
        endDate: "2024-03-01T07:00:00",
      },
      {
        id: "2",
        title: "Valid",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T11:00:00",
      },
      {
        id: "3",
        title: "Late",
        startDate: "2024-03-01T20:00:00",
        endDate: "2024-03-01T21:00:00",
      },
    ];
    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 8, 18, true, 0),
    );
    expect(result.current).toHaveLength(1);
    expect((result.current as DayEventLayout[])[0]!.event.title).toBe("Valid");
  });

  it("correctly handles overlapping events and expands widths (tiled mode)", () => {
    const events: CalendarEvent[] = [
      {
        id: "A",
        title: "A",
        startDate: "2024-03-01T09:00:00",
        endDate: "2024-03-01T11:00:00",
      },
      {
        id: "B",
        title: "B",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T12:00:00",
      },
      {
        id: "C",
        title: "C",
        startDate: "2024-03-01T11:30:00",
        endDate: "2024-03-01T13:00:00",
      },
    ];
    // A and B overlap. B and C overlap. (A and C do not).
    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0),
    );
    const layout = result.current;
    expect(layout).toHaveLength(3);

    const eventA = (layout as DayEventLayout[]).find((l) => l.event.id === "A");
    const eventB = (layout as DayEventLayout[]).find((l) => l.event.id === "B");

    expect(eventA!.width).toBe(50); // 1/2 of container
    expect(eventB!.left).toBe(50);
    expect(eventA!.left).toBe(0);
    expect(eventB!.left).toBe(50);
  });

  it("correctly handles stacked overlap offset mode", () => {
    const events: CalendarEvent[] = [
      {
        id: "A",
        title: "A",
        startDate: "2024-03-01T09:00:00",
        endDate: "2024-03-01T11:00:00",
      },
      {
        id: "B",
        title: "B",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T12:00:00",
      },
    ];
    const { result } = renderHook(
      () => dayLayout(events, baseDate, 0, 24, true, 10), // 10% offset
    );
    const layout = result.current as DayEventLayout[];

    const eventA = layout.find((l) => l.event.id === "A");
    const eventB = layout.find((l) => l.event.id === "B");

    expect(eventA!.left).toBe(0);
    expect(eventB!.left).toBe(10);
    expect(eventB!.width).toBe(90); // 1 - 0.1 = 0.9 = 90%
  });

  it("bypasses ordering when isEventOrderingEnabled is false", () => {
    const events: CalendarEvent[] = [
      {
        id: "A",
        title: "A",
        startDate: "2024-03-01T09:00:00",
        endDate: "2024-03-01T11:00:00",
      },
      {
        id: "B",
        title: "B",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T12:00:00",
      },
    ];
    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0, {
        isEventOrderingEnabled: false,
      }),
    );
    const layout = result.current as DayEventLayout[];

    // They both should have left 0, width 100, zIndex 1
    layout.forEach((l: DayEventLayout) => {
      expect(l.left).toBe(0);
      expect(l.width).toBe(100);
      expect(l.zIndex).toBe(1);
    });
  });

  it("uses enrichedEventsByDate if enableEnrichedEvents is true", () => {
    const events: CalendarEvent[] = [];
    const enrichedEvents = {
      "2024-03-01": [
        {
          id: "A",
          title: "Enriched",
          startDate: "2024-03-01T09:00:00",
          endDate: "2024-03-01T10:00:00",
        },
      ],
    };
    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0, {
        enableEnrichedEvents: true,
        enrichedEventsByDate: enrichedEvents,
      }),
    );

    const layout = result.current as DayEventLayout[];
    expect(layout).toHaveLength(1);
    expect(layout[0]!.event.title).toBe("Enriched");
  });

  it("respects showAllDayRow behavior", () => {
    const events: CalendarEvent[] = [
      {
        id: "A",
        title: "All Day",
        startDate: "2024-03-01",
        endDate: "2024-03-02",
      },
      {
        id: "B",
        title: "Timed",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T12:00:00",
      },
    ];
    const { result: r1 } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0),
    );
    expect(r1.current as DayEventLayout[]).toHaveLength(1);
    expect((r1.current as DayEventLayout[])[0]!.event.id).toBe("B"); // 'A' filtered out

    const { result: r2 } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, false, 0),
    );
    expect(r2.current as DayEventLayout[]).toHaveLength(2); // 'A' kept
    const allDayEvent = (r2.current as DayEventLayout[]).find(
      (l) => l.event.id === "A",
    );
    expect(allDayEvent!.top).toBe(0);
    expect(allDayEvent!.height).toBe(1440); // 24 * 60
  });

  describe("single-day timed events lasting 12h or more", () => {
    const longShift: CalendarEvent = {
      id: "L",
      title: "Long shift",
      startDate: "2024-03-01T08:00:00",
      endDate: "2024-03-01T21:00:00",
    };

    it("keeps them in the time grid when showAllDayRow is true", () => {
      // The all-day banner only accepts multi-day or all-day events, so
      // dropping a long single-day event here would hide it entirely.
      const { result } = renderHook(() =>
        dayLayout([longShift], baseDate, 0, 24, true, 0),
      );
      const layout = result.current as DayEventLayout[];
      expect(layout).toHaveLength(1);
      expect(layout[0]!.top).toBe(480); // 08:00
      expect(layout[0]!.height).toBe(780); // 13h
    });

    it("plots them at their real times when showAllDayRow is false", () => {
      const { result } = renderHook(() =>
        dayLayout([longShift], baseDate, 0, 24, false, 0),
      );
      const layout = result.current as DayEventLayout[];
      expect(layout).toHaveLength(1);
      expect(layout[0]!.top).toBe(480);
      expect(layout[0]!.height).toBe(780);
    });

    it("still moves multi-day events with 12h+ overlap to the banner", () => {
      const multiDay: CalendarEvent = {
        id: "M",
        title: "Overnight conference",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-02T10:00:00",
      };
      const { result } = renderHook(() =>
        dayLayout([multiDay], baseDate, 0, 24, true, 0),
      );
      expect(result.current).toEqual([]);
    });
  });

  it("handles array of dates", () => {
    const dates = [dateFn("2024-03-01"), dateFn("2024-03-02")];
    const events: CalendarEvent[] = [
      {
        id: "A",
        title: "1",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T12:00:00",
      },
      {
        id: "B",
        title: "2",
        startDate: "2024-03-02T10:00:00",
        endDate: "2024-03-02T12:00:00",
      },
    ];
    const { result } = renderHook(() =>
      dayLayout(events, dates, 0, 24, true, 0),
    );
    const layout = result.current as DayEventLayout[][];
    expect(layout).toHaveLength(2);
    expect(layout[0]).toHaveLength(1);
    expect(layout[0]![0]!.event.id).toBe("A");
    expect(layout[1]).toHaveLength(1);
    expect(layout[1]![0]!.event.id).toBe("B");
  });

  it("handles ConcurrentStress correctly grouping 5 overlapping events", () => {
    const events: CalendarEvent[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `Event-${i}`,
      title: `Event ${i}`,
      startDate: "2024-03-01T12:00:00",
      endDate: "2024-03-01T13:00:00",
    }));

    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0),
    );
    const layout = result.current as DayEventLayout[];
    expect(layout).toHaveLength(5);

    // Width should be divided evenly (100 / 5 = 20)
    layout.forEach((l, i) => {
      expect(l.width).toBe(20);
      expect(l.left).toBe(i * 20); // 0, 20, 40, 60, 80
    });
  });

  it("handles NestedOverlaps correctly (an event fully engulfed by another)", () => {
    const events: CalendarEvent[] = [
      {
        id: "Outer",
        title: "Outer",
        startDate: "2024-03-01T09:00:00",
        endDate: "2024-03-01T12:00:00",
      },
      {
        id: "Inner",
        title: "Inner",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T11:00:00",
      },
    ];

    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0),
    );

    const layout = result.current as DayEventLayout[];
    const outerEvent = layout.find((l) => l.event.id === "Outer");
    const innerEvent = layout.find((l) => l.event.id === "Inner");

    expect(outerEvent!.width).toBe(50);
    expect(innerEvent!.width).toBe(50);
    expect(outerEvent!.left).toBe(0);
    expect(innerEvent!.left).toBe(50);
  });

  it("safely plots Zero Duration events without blowing up the layout bounds", () => {
    const events: CalendarEvent[] = [
      {
        id: "Zero",
        title: "Exact Time Entry",
        startDate: "2024-03-01T10:00:00",
        endDate: "2024-03-01T10:00:00", // Exactly zero duration
      },
    ];

    const { result } = renderHook(() =>
      dayLayout(events, baseDate, 0, 24, true, 0),
    );

    const layout = result.current as DayEventLayout[];
    expect(layout).toHaveLength(1);
    const event = layout[0]!;

    // Starting at 10:00 means top is (10 - 0) * 60 = 600px
    expect(event.top).toBe(600);
    // Usually zero duration is mapped to a minimum block height of e.g. 30px or clamped to the event duration itself.
    // If it's literally 0, it shouldn't be negative or NaN.
    expect(event.height).toBeGreaterThanOrEqual(0);
    expect(event.width).toBe(100);
  });
});

describe("native additions", () => {
  const opts = {
    minHour: 0,
    maxHour: 24,
    showAllDayRow: true,
    eventOverlapOffset: 0,
  };
  describe("review focus 1: DST days keep wall-clock positions", () => {
    it.each(["2026-03-08", "2026-11-01"])("10:00 sits at 600 on %s", (day) => {
      const out = withZone("America/New_York", () =>
        layoutDayEvents(
          [
            {
              id: "d",
              title: "D",
              startDate: `${day}T10:00:00`,
              endDate: `${day}T11:00:00`,
            },
          ],
          [dateFn(day)],
          opts,
        ),
      );
      expect(out[0]![0]!.top).toBe(600);
      expect(out[0]![0]!.height).toBe(60);
    });
    it("an event across the spring-forward gap is drawn by wall clock", () => {
      const out = withZone("America/New_York", () =>
        layoutDayEvents(
          [
            {
              id: "g",
              title: "G",
              startDate: "2026-03-08T01:00:00",
              endDate: "2026-03-08T03:00:00",
            },
          ],
          [dateFn("2026-03-08")],
          opts,
        ),
      );
      expect([out[0]![0]!.top, out[0]![0]!.height]).toEqual([60, 120]);
    });
  });
  it("review focus 2: 22:00→02:00 splits across days", () => {
    const e = {
      id: "n",
      title: "Night",
      startDate: "2026-10-20T22:00:00",
      endDate: "2026-10-21T02:00:00",
    };
    const out = layoutDayEvents(
      [e],
      [dateFn("2026-10-20"), dateFn("2026-10-21")],
      opts,
    );
    expect([out[0]![0]!.top, out[0]![0]!.height]).toEqual([1320, 120]);
    expect([out[1]![0]!.top, out[1]![0]!.height]).toEqual([0, 120]);
  });
  it("#14A: no endDate draws a 1-minute event at the 15 minimum", () => {
    const out = layoutDayEvents(
      [{ id: "p", title: "Ping", startDate: "2026-10-22T09:00:00" }],
      [dateFn("2026-10-22")],
      opts,
    );
    expect(out[0]![0]!.height).toBe(15);
  });
  it("tiles the October 22 overlap like the design", () => {
    const out = layoutDayEvents(
      OCT_2026_EVENTS,
      [dateFn("2026-10-22")],
      opts,
    )[0]!;
    const byTitle = Object.fromEntries(out.map((l) => [l.event.title, l]));
    expect([
      byTitle["Design review"]!.left,
      byTitle["Design review"]!.width,
    ]).toEqual([0, 50]);
    expect([byTitle["Interview"]!.left, byTitle["Interview"]!.width]).toEqual([
      50, 50,
    ]);
  });
});
