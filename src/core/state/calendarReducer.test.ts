import { describe, it, expect, afterEach } from "vitest";
import {
  calendarReducer,
  createInitialState,
  type CalendarState,
} from "./calendarReducer";
import { dateFn } from "../utils/date";
import type { ECalendarViewType } from "../types";
import { freezeNow, restoreNow } from "../test/clock";

afterEach(restoreNow);

const s = (
  iso: string,
  view: ECalendarViewType = "month",
  customDays?: number,
) => createInitialState(dateFn(iso), view, customDays);
const key = (st: CalendarState) => st.selectedDate.toFormat("yyyy-MM-dd");

describe("calendarReducer", () => {
  it("NEXT month clamps the day (Jan 31 → Feb 28)", () =>
    expect(key(calendarReducer(s("2026-01-31"), { type: "NEXT" }))).toBe(
      "2026-02-28",
    ));
  it("custom days move by customDays, default 3", () => {
    expect(
      key(calendarReducer(s("2026-10-22", "customDays", 5), { type: "NEXT" })),
    ).toBe("2026-10-27");
    expect(
      key(calendarReducer(s("2026-10-22", "customDays"), { type: "PREV" })),
    ).toBe("2026-10-19");
  });
  it("custom days are clamped to 1–7 when set (calendar-simple)", () => {
    expect(s("2026-10-22", "customDays", 12).customDays).toBe(7);
    expect(s("2026-10-22", "customDays").customDays).toBeUndefined();
    const set = (payload: number | undefined) =>
      calendarReducer(s("2026-10-22", "customDays", 3), {
        type: "SET_CUSTOM_DAYS",
        payload,
      }).customDays;
    expect([set(0), set(4.4), set(9), set(undefined)]).toEqual([
      1,
      4,
      7,
      undefined,
    ]);
    // Moves by the clamped count.
    expect(
      key(calendarReducer(s("2026-10-22", "customDays", 30), { type: "NEXT" })),
    ).toBe("2026-10-29");
  });
  it("schedule moves one day", () =>
    expect(
      key(calendarReducer(s("2026-10-22", "schedule"), { type: "NEXT" })),
    ).toBe("2026-10-23"));
  it("TODAY uses the frozen clock", () => {
    freezeNow("2026-10-22T10:40:00");
    expect(key(calendarReducer(s("2025-01-01"), { type: "TODAY" }))).toBe(
      "2026-10-22",
    );
    restoreNow();
  });
  it("EXTEND_SCHEDULE grows the window; navigation resets it", () => {
    const a = calendarReducer(s("2026-10-22", "schedule"), {
      type: "EXTEND_SCHEDULE",
      payload: 30,
    });
    expect(a.scheduleExtraDays).toBe(30);
    expect(calendarReducer(a, { type: "NEXT" }).scheduleExtraDays).toBe(0);
    expect(
      calendarReducer(a, { type: "SET_VIEW", payload: "month" })
        .scheduleExtraDays,
    ).toBe(0);
  });
});
