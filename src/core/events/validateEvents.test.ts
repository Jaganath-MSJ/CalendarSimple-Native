import { describe, it, expect } from "vitest";
import type { BaseCalendarEvent as CalendarEvent } from "../types";
import { validateEvents, getEventWarnings } from "./validateEvents";

describe("validateEvents", () => {
  const events = [
    {
      id: "1",
      title: "Valid Event",
      startDate: "2024-01-01",
      endDate: "2024-01-02",
    },
    { id: "2", title: "No End Date", startDate: "2024-01-01" },
    {
      id: "3",
      title: "Invalid Event",
      startDate: "2024-01-05",
      endDate: "2024-01-01",
    }, // Ends before it starts
  ];

  it("filters out events with invalid end dates", () => {
    const result = { current: validateEvents(events, {}) };

    expect(result.current).toHaveLength(2);
    expect(result.current.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("returns all events if eventsAreSorted is true", () => {
    const result = {
      current: validateEvents(events, { eventsAreSorted: true }),
    };

    expect(result.current).toHaveLength(3);
    expect(result.current.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  // Known caveat (K-03): eventsAreSorted=true bypasses all sorting/validation.
  // Unsorted input is returned in the original order — the library never re-sorts.
  it("preserves input order when eventsAreSorted=true even if events are not sorted", () => {
    const unsorted: CalendarEvent[] = [
      { id: "b", title: "B", startDate: "2024-03-10" },
      { id: "a", title: "A", startDate: "2024-03-01" },
      { id: "c", title: "C", startDate: "2024-03-05" },
    ];
    const result = {
      current: validateEvents(unsorted, { eventsAreSorted: true }),
    };
    expect(result.current.map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  // Known behaviour (C-TC3): events with endDate before startDate are silently
  // filtered — no warning is emitted. Pass valid date ranges to avoid silent drops.
  it("silently filters negative-duration events without warning (C-TC3)", () => {
    const result = { current: validateEvents(events, {}) };
    expect(result.current).toHaveLength(2);
    expect(result.current.map((e) => e.id)).toEqual(["1", "2"]);
    expect(getEventWarnings(events, {})).toEqual([]);
  });

  it("returns all events if enableEnrichedEvents is true", () => {
    const result = {
      current: validateEvents(events, {
        eventsAreSorted: false,
        enableEnrichedEvents: true,
      }),
    };

    expect(result.current).toHaveLength(3);
    expect(result.current.map((e) => e.id)).toEqual(["1", "2", "3"]);
  });

  it("safely processes events missing id and title without crashing (MissingDataFields)", () => {
    // Asserting that event processing doesn't crash when optional fields are omitted
    // Event components down the line handle the "No Title" visual fallback natively
    const rawEvents = [
      {
        startDate: "2024-01-01",
      },
    ];

    const result = {
      current: validateEvents(rawEvents as unknown as CalendarEvent[], {}),
    };
    expect(result.current).toHaveLength(1);
    expect(result.current[0]?.startDate).toBe("2024-01-01");
    expect(result.current[0]?.id).toBeUndefined();
  });

  // K-03 warning tests
  it("emits console.warn (K-03) when eventsAreSorted=true but events are unsorted", () => {
    const unsorted: CalendarEvent[] = [
      { id: "b", title: "B", startDate: "2024-03-10" },
      { id: "a", title: "A", startDate: "2024-03-01" },
      { id: "c", title: "C", startDate: "2024-03-05" },
    ];
    const warnings: string[] = [];
    warnings.push(...getEventWarnings(unsorted, { eventsAreSorted: true }));
    expect(warnings).toContainEqual(expect.stringContaining("eventsAreSorted"));
  });

  it("does NOT emit K-03 warn when eventsAreSorted=true and events are sorted", () => {
    const sorted: CalendarEvent[] = [
      { id: "a", title: "A", startDate: "2024-03-01" },
      { id: "b", title: "B", startDate: "2024-03-05" },
      { id: "c", title: "C", startDate: "2024-03-10" },
    ];
    const warnings: string[] = [];
    warnings.push(...getEventWarnings(sorted, { eventsAreSorted: true }));
    expect(warnings).toEqual([]);
  });

  it("does NOT emit K-03 warn when eventsAreSorted is false or undefined", () => {
    const unsorted: CalendarEvent[] = [
      { id: "b", title: "B", startDate: "2024-03-10" },
      { id: "a", title: "A", startDate: "2024-03-01" },
    ];
    const warnings: string[] = [];
    warnings.push(...getEventWarnings(unsorted, { eventsAreSorted: false }));
    warnings.push(...getEventWarnings(unsorted, {}));
    expect(warnings).toEqual([]);
  });

  // K-05 warning tests
  it("emits console.warn (K-05) when enableEnrichedEvents=true but enrichedEventsByDate is not provided", () => {
    const warnings: string[] = [];
    warnings.push(
      ...getEventWarnings(events, {
        eventsAreSorted: false,
        enableEnrichedEvents: true,
        enrichedEventsByDate: undefined,
      }),
    );
    expect(warnings).toContainEqual(
      expect.stringContaining("enrichedEventsByDate"),
    );
  });

  it("does NOT emit K-05 warn when enableEnrichedEvents=true and enrichedEventsByDate is provided", () => {
    const map: Record<string, CalendarEvent[]> = {
      "2024-01-01": [events[0]!],
    };
    const warnings: string[] = [];
    warnings.push(
      ...getEventWarnings(events, {
        eventsAreSorted: false,
        enableEnrichedEvents: true,
        enrichedEventsByDate: map,
      }),
    );
    expect(warnings).toEqual([]);
  });

  it("does NOT emit K-05 warn when enableEnrichedEvents is false or undefined", () => {
    const warnings: string[] = [];
    warnings.push(
      ...getEventWarnings(events, {
        eventsAreSorted: false,
        enableEnrichedEvents: false,
        enrichedEventsByDate: undefined,
      }),
    );
    warnings.push(...getEventWarnings(events, {}));
    expect(warnings).toEqual([]);
  });
});

describe("garbage input (review focus 3)", () => {
  const good = { id: "g", title: "ok", startDate: "2026-10-22T09:00:00" };
  it("drops unparseable dates and keeps the rest", () => {
    const out = validateEvents(
      [
        good,
        { id: "b", title: "bad", startDate: "not-a-date" },
        { id: "c", title: "", startDate: "2026-10-22", endDate: "garbage" },
      ],
      {},
    );
    expect(out.map((e) => e.id)).toEqual(["g"]);
  });
  it("keeps an empty title (labelled later, #14C)", () =>
    expect(validateEvents([{ ...good, title: "" }], {})).toHaveLength(1));
  it("warns about dropped events", () =>
    expect(
      getEventWarnings([{ id: "b", title: "x", startDate: "nope" }], {}),
    ).toContain(
      "[calendar] dropped 1 event(s) with an invalid startDate or endDate.",
    ));
});
