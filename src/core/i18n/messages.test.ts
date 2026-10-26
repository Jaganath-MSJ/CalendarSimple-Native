import { describe, it, expect } from "vitest";
import { DEFAULT_MESSAGES, resolveMessages } from ".";
describe("messages", () => {
  it("falls back key by key", () => {
    const m = resolveMessages({ today: "Aujourd'hui" });
    expect(m.today).toBe("Aujourd'hui");
    expect(m.week).toBe("Week");
  });
  it("formats parameterised messages", () => {
    expect(DEFAULT_MESSAGES.more(3)).toBe("+ 3 more");
    expect(DEFAULT_MESSAGES.dayOfTotal(1, 3)).toBe("(Day 1/3)");
    expect(DEFAULT_MESSAGES.noTitle).toBe("No title");
    expect(DEFAULT_MESSAGES.moreAllDay(3)).toBe(
      "3 more all-day events, tap to expand",
    );
    expect([
      DEFAULT_MESSAGES.eventCount(0),
      DEFAULT_MESSAGES.eventCount(1),
      DEFAULT_MESSAGES.eventCount(9),
    ]).toEqual(["no events", "1 event", "9 events"]);
  });
});
