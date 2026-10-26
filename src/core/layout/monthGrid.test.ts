import { describe, it, expect, afterEach } from "vitest";
import { buildMonthGrid } from "./monthGrid";
import { dateFn } from "../utils/date";
import type { BaseCalendarEvent as CalendarEvent } from "../types";
import { freezeNow, restoreNow } from "../test/clock";
import { OCT_2026_EVENTS } from "../test/fixtures";

afterEach(restoreNow);

describe("buildMonthGrid", () => {
  const selectedDate = dateFn("2024-02-15"); // Feb 2024 starts on Thursday
  const weekStartsOn = 0; // Sunday
  const weekEndsOn = 6; // Saturday

  it("generates correctly sized month grid", () => {
    const result = {
      current: buildMonthGrid(selectedDate, [], weekStartsOn, weekEndsOn),
    };
    const grid = result.current;
    expect(grid.length).toBeGreaterThanOrEqual(4);
    const firstWeek = grid[0]!;
    expect(firstWeek).toHaveLength(7);
    expect(firstWeek[0]!.displayDay).toBe(28); // Jan 28
    expect(firstWeek[4]!.displayDay).toBe(1); // Feb 1
  });

  it("handles custom 5-day week bounds without array out-of-bounds crash (Issue 2)", () => {
    const customStart = 1; // Monday
    const customEnd = 5; // Friday

    const result = {
      current: buildMonthGrid(selectedDate, [], customStart, customEnd),
    };
    const grid = result.current;
    expect(grid.length).toBeGreaterThanOrEqual(4);

    // Each row should only be exactly 5 days long
    const firstWeek = grid[0]!;
    expect(firstWeek).toHaveLength(5);

    // Assert there are no undefined entries in the row
    firstWeek.forEach((dayInfo) => {
      expect(dayInfo).toBeDefined();
      expect(dayInfo.currentDate).toBeDefined();
    });
  });

  it("assigns events to slots in Tetris pattern", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "A", startDate: "2024-02-01", endDate: "2024-02-03" },
      { id: "2", title: "B", startDate: "2024-02-02", endDate: "2024-02-02" },
      { id: "3", title: "C", startDate: "2024-02-02", endDate: "2024-02-04" },
    ];

    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn),
    };

    const firstWeek = result.current[0]!;

    const thuEvents = firstWeek[4]!.events; // Feb 1
    expect(thuEvents[0]?.id).toBe("1");

    const friEvents = firstWeek[5]!.events; // Feb 2
    expect(friEvents[0]?.id).toBe("1"); // Spacer
    expect(friEvents[1]?.id).toBe("3"); // C because it's longer
    expect(friEvents[2]?.id).toBe("2"); // B
  });

  it("bypasses ordering when isEventOrderingEnabled is false", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "A", startDate: "2024-02-01", endDate: "2024-02-03" },
      { id: "2", title: "B", startDate: "2024-02-02", endDate: "2024-02-02" },
    ];

    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn, {
        isEventOrderingEnabled: false,
      }),
    };

    const firstWeek = result.current[0]!;
    expect(firstWeek[4]!.events[0]?.id).toBe("1"); // A is index 0
    expect(firstWeek[5]!.events[1]?.id).toBe("2"); // B is index 1
  });

  it("uses enrichedEventsByDate when enableEnrichedEvents is true", () => {
    const events: CalendarEvent[] = [];
    const enrichedEvents = {
      "2024-02-15": [{ id: "A", title: "Enriched", startDate: "2024-02-15" }],
    };

    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn, {
        enableEnrichedEvents: true,
        enrichedEventsByDate: enrichedEvents,
      }),
    };

    const thirdWeek = result.current[2]!; // Feb 15 week
    expect(thirdWeek[4]!.displayDay).toBe(15);
    expect(thirdWeek[4]!.events[0]?.id).toBe("A");
  });

  it("handles custom sortedMonthView function", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "A", startDate: "2024-02-01", endDate: "2024-02-02" },
      { id: "2", title: "B", startDate: "2024-02-01", endDate: "2024-02-05" },
    ];

    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn, {
        // Reverse standard custom logic: put shorter events first
        sortedMonthView: (a, b) =>
          new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime(),
      }),
    };

    const firstWeek = result.current[0]!;
    const thuEvents = firstWeek[4]!.events; // Feb 1
    expect(thuEvents[0]?.id).toBe("1"); // A is shorter, put first
    expect(thuEvents[1]?.id).toBe("2"); // B is longer, put second
  });

  it("handles DurationOddities (Extreme 5-year ranges) without infinite loop crash", () => {
    const events: CalendarEvent[] = [
      {
        id: "Extreme",
        title: "5 Year Span",
        startDate: "2020-01-01",
        endDate: "2025-01-01",
      },
    ];

    // Testing a month right in the middle: Feb 2024
    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn),
    };

    const grid = result.current;

    // The event should be present on every single day of the month grid
    for (const week of grid) {
      for (const day of week) {
        expect(day.events[0]?.id).toBe("Extreme");
      }
    }
  });

  it("preserves original event order when sortedMonthView is false", () => {
    // A is shorter but listed first in input; B is longer but listed second.
    // With sortedMonthView: true (default), B would land in slot 0 because it's longer.
    // With sortedMonthView: false, the week-level sort is skipped, so A stays in slot 0.
    const events: CalendarEvent[] = [
      {
        id: "A",
        title: "Short",
        startDate: "2024-02-01",
        endDate: "2024-02-01",
      },
      {
        id: "B",
        title: "Long",
        startDate: "2024-02-01",
        endDate: "2024-02-05",
      },
    ];

    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn, {
        sortedMonthView: false,
        eventsAreSorted: true, // skip the pre-sort so input order is fully preserved
      }),
    };

    // Feb 2024 starts Thursday. Week 0: Sun Jan 28 … Sat Feb 3.
    // Feb 1 is at index 4 (Thursday).
    const feb1 = result.current[0]![4]!;
    expect(feb1.displayDay).toBe(1);
    expect(feb1.events[0]?.id).toBe("A"); // input-order slot 0
    expect(feb1.events[1]?.id).toBe("B"); // input-order slot 1
  });

  it("handles strictly zero-duration events", () => {
    const events: CalendarEvent[] = [
      {
        id: "Zero",
        title: "Moment",
        startDate: "2024-02-15T12:00:00",
        endDate: "2024-02-15T12:00:00",
      },
    ];

    const result = {
      current: buildMonthGrid(selectedDate, events, weekStartsOn, weekEndsOn),
    };

    const thirdWeek = result.current[2]!;
    expect(thirdWeek[4]!.displayDay).toBe(15);
    expect(thirdWeek[4]!.events[0]?.id).toBe("Zero");
  });

  it("#8: a timed event ending at 00:00 stays on its start day", () => {
    const e = {
      id: "x",
      title: "Late",
      startDate: "2026-10-20T22:00:00",
      endDate: "2026-10-21T00:00:00",
    };
    const grid = buildMonthGrid(dateFn("2026-10-15"), [e], 0, 6);
    const cell = (d: number) =>
      grid.flat().find((c) => c.isCurrentMonth && c.displayDay === d)!;
    expect(cell(20).totalEvents).toBe(1);
    expect(cell(21).totalEvents).toBe(0);
  });
  it("review focus 2: 22:00→02:00 shows on both days", () => {
    const e = {
      id: "y",
      title: "Night",
      startDate: "2026-10-20T22:00:00",
      endDate: "2026-10-21T02:00:00",
    };
    const grid = buildMonthGrid(dateFn("2026-10-15"), [e], 0, 6);
    const cell = (d: number) =>
      grid.flat().find((c) => c.isCurrentMonth && c.displayDay === d)!;
    expect([cell(20).totalEvents, cell(21).totalEvents]).toEqual([1, 1]);
  });
  it("#17C: flags today in an adjacent-month cell", () => {
    freezeNow("2026-10-02T09:00:00");
    const grid = buildMonthGrid(dateFn("2026-09-15"), [], 0, 6);
    const oct2 = grid
      .flat()
      .find((c) => !c.isCurrentMonth && c.displayDay === 2)!;
    expect(oct2.isToday).toBe(false);
    expect(oct2.isTodayAdjacent).toBe(true);
  });
  it("lays out the October sample like the design", () => {
    const grid = buildMonthGrid(dateFn("2026-10-22"), OCT_2026_EVENTS, 0, 6);
    const oct22 = grid
      .flat()
      .find((c) => c.isCurrentMonth && c.displayDay === 22)!;
    expect(oct22.totalEvents).toBe(9);
    expect(
      oct22.events
        .slice(0, 3)
        .map((e) =>
          e && !e.isSpacer ? e.title : e?.isSpacer ? "spacer" : null,
        ),
    ).toEqual(["Hackathon", "spacer", "spacer"]); // Design sprint and Release freeze continue from earlier days
  });
});
