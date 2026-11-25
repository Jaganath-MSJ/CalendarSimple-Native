import { describe, it, expect } from "vitest";
import {
  CORE_DEFAULTS,
  CALENDAR_ACTIONS,
  DATE_FORMATS,
  LAYOUT_CONSTANTS,
  MONTH_METRICS,
  VIEW_ORDER,
} from ".";

describe("core constants", () => {
  it("keeps web defaults; no Schedule window (1.1)", () => {
    expect(CORE_DEFAULTS.weekStartsOn).toBe(0);
    expect(CORE_DEFAULTS.selectable).toBe(false);
    expect(CORE_DEFAULTS).not.toHaveProperty("scheduleDays");
    expect(CORE_DEFAULTS).not.toHaveProperty("classNames");
  });
  it("has no EXTEND_SCHEDULE action (1.1)", () =>
    expect(CALENDAR_ACTIONS).not.toHaveProperty("EXTEND_SCHEDULE"));
  it("drops dead code (#15)", () => {
    expect(DATE_FORMATS).not.toHaveProperty("FULL_DATE");
    expect(DATE_FORMATS).not.toHaveProperty("DAY_INDEX");
    expect(LAYOUT_CONSTANTS).not.toHaveProperty("DEFAULT_ROWS");
  });
  it("has phone month metrics", () =>
    expect(MONTH_METRICS.phone.eventPitch).toBe(8));
  it("orders header views like web", () =>
    expect(VIEW_ORDER).toEqual(["day", "week", "month", "schedule"]));
});
