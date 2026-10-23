import { describe, it, expect } from "vitest";
import { buildLabelCache } from "./labels";

describe("buildLabelCache", () => {
  it("24-hour labels", () =>
    expect(buildLabelCache("en", false, "half").hourLabels[9]).toBe("09:00"));
  it("12-hour labels", () =>
    expect(buildLabelCache("en", true, "half").hourLabels[13]).toBe("01 PM"));
  it("Sunday-first short weekdays", () =>
    expect(
      buildLabelCache("en", false, "half").weekdayNames.slice(0, 2),
    ).toEqual(["Sun", "Mon"]));
  it("localised months", () =>
    expect(buildLabelCache("fr", false, "full").monthNames[0]).toBe("janvier"));
  it("returns the same object for the same arguments", () =>
    expect(buildLabelCache("en", false, "half")).toBe(
      buildLabelCache("en", false, "half"),
    ));
});
