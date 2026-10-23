import { describe, it, expect } from "vitest";
import {
  groupScheduleEvents,
  getScheduleTimeLabel,
  getScheduleTitle,
} from "./scheduleGroups";
import { dateFn } from "../utils/date";
import { DEFAULT_MESSAGES } from "../i18n";
import type { BaseCalendarEvent as CalendarEvent } from "../types";
import { OCT_2026_EVENTS } from "../test/fixtures";

// Web `useScheduleView` returned `groupedEvents` (a record keyed by date),
// `renderEventTime(event, dateKey)` and `renderEventTitle(event, dateKey)`.
// These helpers map the ported assertions onto the pure functions; web time
// strings with double spaces are single-spaced and trimmed (#7).
const WIDE = { start: dateFn("2000-01-01"), end: dateFn("2100-01-01") };
function scheduleView({
  events,
  is12Hour = false,
}: {
  events: CalendarEvent[];
  is12Hour?: boolean;
}) {
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  for (const g of groupScheduleEvents(events, WIDE))
    groupedEvents[g.dateKey] = g.events;
  return {
    groupedEvents,
    renderEventTime: (event: CalendarEvent, dateKey: string) =>
      getScheduleTimeLabel(event, dateFn(dateKey), {
        is12Hour,
        locale: "en",
        messages: DEFAULT_MESSAGES,
      }),
    renderEventTitle: (event: CalendarEvent, dateKey: string) =>
      getScheduleTitle(event, dateFn(dateKey), DEFAULT_MESSAGES),
  };
}

describe("schedule grouping (ported from useScheduleView)", () => {
  const events: CalendarEvent[] = [
    {
      id: "1",
      title: "Single Day Event",
      startDate: "2024-03-01T10:00:00",
      endDate: "2024-03-01T11:00:00",
    },
    {
      id: "2",
      title: "Multi Day Event",
      startDate: "2024-03-01T15:00:00",
      endDate: "2024-03-03T10:00:00",
    },
    {
      id: "3",
      title: "All Day Event",
      startDate: "2024-03-05", // No time
    },
  ];

  it("groups events by day correctly", () => {
    const groups = scheduleView({ events }).groupedEvents;

    // Day 1 should have Event 1 and Event 2
    expect(groups["2024-03-01"]).toHaveLength(2);
    expect(groups["2024-03-01"]!.map((e) => e.id)).toEqual(["1", "2"]);

    // Day 2 should have Event 2
    expect(groups["2024-03-02"]).toHaveLength(1);
    expect(groups["2024-03-02"]![0]!.id).toBe("2");

    // Day 3 should have Event 2
    expect(groups["2024-03-03"]).toHaveLength(1);
    expect(groups["2024-03-03"]![0]!.id).toBe("2");

    // Day 5 should have Event 3
    expect(groups["2024-03-05"]).toHaveLength(1);
    expect(groups["2024-03-05"]![0]!.id).toBe("3");
  });

  describe("renderEventTime", () => {
    const { renderEventTime } = scheduleView({ events });

    it("renders simple single day times", () => {
      const time = renderEventTime(events[0]!, "2024-03-01");
      expect(time).toContain("10 – 11");
    });

    it("renders all day for date-only formats", () => {
      const time = renderEventTime(events[2]!, "2024-03-05");
      expect(time).toBe("All day");
    });

    it("handles multi-day time formatting correctly depending on the day", () => {
      // First day
      const timeStart = renderEventTime(events[1]!, "2024-03-01");
      expect(timeStart).toContain("15"); // Shows start time only

      // Middle day
      const timeMiddle = renderEventTime(events[1]!, "2024-03-02");
      expect(timeMiddle).toBe("All day");

      // Last day
      const timeEnd = renderEventTime(events[1]!, "2024-03-03");
      expect(timeEnd).toContain("Until 10");
    });
  });

  describe("renderEventTitle", () => {
    const { renderEventTitle } = scheduleView({ events });

    it("renders normal title for single day events", () => {
      expect(renderEventTitle(events[0]!, "2024-03-01")).toBe(
        "Single Day Event",
      );
    });

    it("appends day tracking for multi-day events", () => {
      // 15:00 on 03-01 → 10:00 on 03-03 covers 3 calendar days, even though
      // less than 48 elapsed hours separate start and end.
      expect(renderEventTitle(events[1]!, "2024-03-01")).toBe(
        "Multi Day Event (Day 1/3)",
      );
      expect(renderEventTitle(events[1]!, "2024-03-02")).toBe(
        "Multi Day Event (Day 2/3)",
      );
      expect(renderEventTitle(events[1]!, "2024-03-03")).toBe(
        "Multi Day Event (Day 3/3)",
      );
    });

    it("counts calendar days for overnight events", () => {
      const overnight: CalendarEvent = {
        id: "N",
        title: "Overnight",
        startDate: "2024-03-01T22:00:00",
        endDate: "2024-03-02T02:00:00",
      };
      expect(renderEventTitle(overnight, "2024-03-01")).toBe(
        "Overnight (Day 1/2)",
      );
      expect(renderEventTitle(overnight, "2024-03-02")).toBe(
        "Overnight (Day 2/2)",
      );
    });
  });

  describe("events ending exactly at midnight", () => {
    // An end time of 00:00 is exclusive: the event is over before that day starts.
    const lateShow: CalendarEvent = {
      id: "late",
      title: "Late show",
      startDate: "2024-03-01T22:00:00",
      endDate: "2024-03-02T00:00:00",
    };
    const conference: CalendarEvent = {
      id: "conf",
      title: "Conference",
      startDate: "2024-03-01T10:00:00",
      endDate: "2024-03-03T00:00:00",
    };
    const fullDay: CalendarEvent = {
      id: "full",
      title: "Offsite",
      startDate: "2024-03-01T00:00:00",
      endDate: "2024-03-02T00:00:00",
    };
    const midnightPoint: CalendarEvent = {
      id: "point",
      title: "New day marker",
      startDate: "2024-03-01T00:00:00",
      endDate: "2024-03-01T00:00:00",
    };

    const getHook = (events: CalendarEvent[]) =>
      scheduleView({ events, is12Hour: true });

    it("does not add an entry on the day the event ends at 00:00", () => {
      const { groupedEvents, renderEventTime, renderEventTitle } = getHook([
        lateShow,
      ]);
      expect(Object.keys(groupedEvents)).toEqual(["2024-03-01"]);
      expect(renderEventTime(lateShow, "2024-03-01")).toBe("10 PM – 12 AM");
      expect(renderEventTitle(lateShow, "2024-03-01")).toBe("Late show");
    });

    it("treats the day before a 00:00 end as the last day of a multi-day event", () => {
      const { groupedEvents, renderEventTime, renderEventTitle } = getHook([
        conference,
      ]);
      expect(Object.keys(groupedEvents)).toEqual(["2024-03-01", "2024-03-02"]);
      expect(renderEventTime(conference, "2024-03-02")).toBe("All day");
      expect(renderEventTitle(conference, "2024-03-02")).toBe(
        "Conference (Day 2/2)",
      );
    });

    it("shows a midnight-to-midnight event as a single all-day entry", () => {
      const { groupedEvents, renderEventTime, renderEventTitle } = getHook([
        fullDay,
      ]);
      expect(Object.keys(groupedEvents)).toEqual(["2024-03-01"]);
      expect(renderEventTime(fullDay, "2024-03-01")).toBe("All day");
      expect(renderEventTitle(fullDay, "2024-03-01")).toBe("Offsite");
    });

    it("keeps zero-duration midnight events on their own day", () => {
      const { groupedEvents } = getHook([midnightPoint]);
      expect(Object.keys(groupedEvents)).toEqual(["2024-03-01"]);
    });
  });
});

describe("native additions", () => {
  const range = { start: dateFn("2026-10-22"), end: dateFn("2026-11-20") };
  it("#6C: only days inside the window", () => {
    const groups = groupScheduleEvents(OCT_2026_EVENTS, range);
    expect(groups[0]!.dateKey).toBe("2026-10-22");
    expect(groups.some((g) => g.dateKey < "2026-10-22")).toBe(false);
    expect(groups[0]!.events.map((e) => e.title)).toContain("Design sprint"); // started 10-19, still on 10-22
  });
  it("#7: collapses whitespace", () => {
    const e = {
      title: "a",
      startDate: "2026-10-22T09:00:00",
      endDate: "2026-10-22T10:30:00",
    };
    expect(
      getScheduleTimeLabel(e, dateFn("2026-10-22"), {
        is12Hour: true,
        locale: "en",
        messages: DEFAULT_MESSAGES,
      }),
    ).toBe("9 AM – 10:30 AM");
    expect(
      getScheduleTimeLabel(e, dateFn("2026-10-22"), {
        is12Hour: false,
        locale: "en",
        messages: DEFAULT_MESSAGES,
      }),
    ).toBe("9 – 10:30");
  });
  it("review focus 2: midnight end is exclusive, 02:00 end is not", () => {
    const r = { start: dateFn("2026-10-20"), end: dateFn("2026-10-22") };
    const a = groupScheduleEvents(
      [
        {
          id: "a",
          title: "A",
          startDate: "2026-10-20T22:00:00",
          endDate: "2026-10-21T00:00:00",
        },
      ],
      r,
    );
    const b = groupScheduleEvents(
      [
        {
          id: "b",
          title: "B",
          startDate: "2026-10-20T22:00:00",
          endDate: "2026-10-21T02:00:00",
        },
      ],
      r,
    );
    expect(a.map((g) => g.dateKey)).toEqual(["2026-10-20"]);
    expect(b.map((g) => g.dateKey)).toEqual(["2026-10-20", "2026-10-21"]);
  });
  it("titles multi-day events with messages", () =>
    expect(
      getScheduleTitle(
        { title: "Hackathon", startDate: "2026-10-22", endDate: "2026-10-23" },
        dateFn("2026-10-23"),
        DEFAULT_MESSAGES,
      ),
    ).toBe("Hackathon (Day 2/2)"));
});
