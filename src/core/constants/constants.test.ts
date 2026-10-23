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
  it("keeps web defaults and adds scheduleDays", () => {
    expect(CORE_DEFAULTS.weekStartsOn).toBe(0);
    expect(CORE_DEFAULTS.selectable).toBe(false);
    expect(CORE_DEFAULTS.scheduleDays).toBe(30);
    expect(CORE_DEFAULTS).not.toHaveProperty("classNames");
  });
  it("adds EXTEND_SCHEDULE", () =>
    expect(CALENDAR_ACTIONS.EXTEND_SCHEDULE).toBe("EXTEND_SCHEDULE"));
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
