import { describe, it, expect } from "vitest";
import {
  calculateMaxEvents,
  isAllDayEvent,
  isMultiDay,
  getLastEventDay,
  resolveDirection,
} from "./common";
import { LAYOUT_CONSTANTS, MONTH_METRICS } from "../constants";
import type { BaseCalendarEvent as CalendarEvent } from "../types";

describe("common utils", () => {
  describe("calculateMaxEvents", () => {
    it("should calculate correctly based on given height and rows", () => {
      // Let's mock a height where each row has plenty of space
      const height = 1200;
      const rowsInView = 6;
      const cellHeight = 1200 / 6; // 200
      // Math.round((200 - DATE_LABEL_HEIGHT - CELL_PADDING) / EVENT_HEIGHT) - 1
      const availableNodeHeight =
        cellHeight -
        LAYOUT_CONSTANTS.DATE_LABEL_HEIGHT -
        LAYOUT_CONSTANTS.CELL_PADDING;

      const expected =
        Math.round(availableNodeHeight / LAYOUT_CONSTANTS.EVENT_HEIGHT) - 1;

      const result = calculateMaxEvents(height, rowsInView);
      expect(result).toBe(Math.max(0, expected));
    });

    it("should not return a negative number for small heights", () => {
      expect(calculateMaxEvents(10, 6)).toBe(0);
    });
  });

  describe("isAllDayEvent", () => {
    it("returns true when event has only date format", () => {
      expect(
        isAllDayEvent({ id: "1", title: "e", startDate: "2024-01-01" }),
      ).toBe(true);
      expect(
        isAllDayEvent({
          id: "1",
          title: "e",
          startDate: "2024-01-01",
          endDate: "2024-01-02",
        }),
      ).toBe(true);
    });

    it("returns false when event has time formats", () => {
      expect(
        isAllDayEvent({
          id: "1",
          title: "e",
          startDate: "2024-01-01T10:00:00",
        }),
      ).toBe(false);
      expect(
        isAllDayEvent({
          id: "1",
          title: "e",
          startDate: "2024-01-01 10:00:00",
        }),
      ).toBe(false);
      expect(
        isAllDayEvent({
          id: "1",
          title: "e",
          startDate: "2024-01-01",
          endDate: "2024-01-02T10:00:00",
        }),
      ).toBe(false);
    });

    // Regression: a non-string startDate/endDate must not crash isDateOnly
    // (dateStr.includes is not a function). Such values carry a concrete time,
    // so they are treated as timed events, not all-day.
    it("does not throw and returns false for non-string dates", () => {
      const dateObjEvent = {
        id: "1",
        title: "e",
        startDate: new Date("2024-01-01T10:00:00"),
        endDate: new Date("2024-01-01T11:00:00"),
      } as unknown as CalendarEvent;
      expect(() => isAllDayEvent(dateObjEvent)).not.toThrow();
      expect(isAllDayEvent(dateObjEvent)).toBe(false);

      const timestampEvent = {
        id: "2",
        title: "e",
        startDate: 1704103200000,
      } as unknown as CalendarEvent;
      expect(() => isAllDayEvent(timestampEvent)).not.toThrow();
      expect(isAllDayEvent(timestampEvent)).toBe(false);
    });
  });

  describe("resolveDirection", () => {
    it("returns explicit 'rtl' even when locale is LTR", () => {
      expect(resolveDirection("rtl", "en")).toBe("rtl");
    });

    it("returns explicit 'ltr' even when locale is RTL", () => {
      expect(resolveDirection("ltr", "ar")).toBe("ltr");
    });

    it("infers 'rtl' from Arabic locale", () => {
      expect(resolveDirection(undefined, "ar")).toBe("rtl");
    });

    it("infers 'rtl' from BCP-47 region tag (ar-SA)", () => {
      expect(resolveDirection(undefined, "ar-SA")).toBe("rtl");
    });

    it("infers 'rtl' from underscore variant (he_IL)", () => {
      expect(resolveDirection(undefined, "he_IL")).toBe("rtl");
    });

    it("is case-insensitive on locale", () => {
      expect(resolveDirection(undefined, "AR")).toBe("rtl");
    });

    it("infers 'ltr' from English", () => {
      expect(resolveDirection(undefined, "en")).toBe("ltr");
    });

    it("defaults to 'ltr' when both args are undefined", () => {
      expect(resolveDirection(undefined, undefined)).toBe("ltr");
    });

    it.each(["he", "fa", "ur", "ps", "sd", "ckb", "yi"])(
      "infers 'rtl' from locale '%s'",
      (loc) => {
        expect(resolveDirection(undefined, loc)).toBe("rtl");
      },
    );
  });

  describe("isMultiDay", () => {
    it("returns false if there is no endDate provided", () => {
      expect(
        isMultiDay({ id: "1", title: "e", startDate: "2024-01-01T10:00:00" }),
      ).toBe(false);
    });

    it("returns false for same day events even with different times", () => {
      expect(
        isMultiDay({
          id: "1",
          title: "e",
          startDate: "2024-01-01T10:00:00",
          endDate: "2024-01-01T14:00:00",
        }),
      ).toBe(false);
    });

    it("returns true when events span across midnight", () => {
      expect(
        isMultiDay({
          id: "1",
          title: "e",
          startDate: "2024-01-01T23:00:00",
          endDate: "2024-01-02T01:00:00",
        }),
      ).toBe(true);
      expect(
        isMultiDay({
          id: "1",
          title: "e",
          startDate: "2024-01-01",
          endDate: "2024-01-02",
        }),
      ).toBe(true);
    });
  });
});

describe("calculateMaxEvents metrics (#9)", () => {
  it("web metrics match web", () => expect(calculateMaxEvents(600, 5)).toBe(2));
  it("phone metrics use the 8 px bar pitch", () =>
    expect(calculateMaxEvents(701, 5, MONTH_METRICS.phone)).toBe(13));
});
describe("getLastEventDay", () => {
  const day = (e: Parameters<typeof getLastEventDay>[0]) =>
    getLastEventDay(e).toFormat("yyyy-MM-dd");
  it("all-day end is inclusive", () =>
    expect(
      day({ title: "a", startDate: "2024-02-20", endDate: "2024-02-22" }),
    ).toBe("2024-02-22"));
  it("timed end at 00:00 is exclusive", () =>
    expect(
      day({
        title: "a",
        startDate: "2024-02-20T22:00:00",
        endDate: "2024-02-21T00:00:00",
      }),
    ).toBe("2024-02-20"));
  it("timed end after midnight counts", () =>
    expect(
      day({
        title: "a",
        startDate: "2024-02-20T22:00:00",
        endDate: "2024-02-21T02:00:00",
      }),
    ).toBe("2024-02-21"));
  it("no end is the start day", () =>
    expect(day({ title: "a", startDate: "2024-02-20T09:00:00" })).toBe(
      "2024-02-20",
    ));
});
