import { describe, it, expect, afterEach } from "vitest";
import { calendarReducer, createInitialState } from "./calendarReducer";
import { getNavigatedDate } from "./navigation";
import { dateFn, getYearList } from "../utils/date";
import { freezeNow, restoreNow } from "../test/clock";

afterEach(restoreNow);

describe("navigation", () => {
  it("predicts the same date as the reducer", () => {
    for (const view of [
      "month",
      "week",
      "day",
      "schedule",
      "customDays",
    ] as const)
      for (const dir of [1, -1] as const) {
        const st = createInitialState(dateFn("2026-10-22"), view, 3);
        expect(getNavigatedDate(st, dir).toISODate()).toBe(
          calendarReducer(st, {
            type: dir === 1 ? "NEXT" : "PREV",
          }).selectedDate.toISODate(),
        );
      }
  });
  it("#12A: year list grows to include the shown year", () => {
    freezeNow("2026-10-22T10:40:00");
    expect(getYearList(5, 5, 2040)).toContain(2040);
    expect(getYearList(5, 5, 2001)[0]).toBe(2001);
    restoreNow();
  });
});
