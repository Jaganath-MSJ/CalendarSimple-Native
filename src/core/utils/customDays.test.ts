import { describe, expect, it } from "vitest";
import { clampCustomDays } from "./customDays";

describe("clampCustomDays", () => {
  it("keeps 1–7, rounds, clamps, and defaults to 3", () => {
    expect([1, 3, 7].map(clampCustomDays)).toEqual([1, 3, 7]);
    expect(clampCustomDays(2.4)).toBe(2);
    expect(clampCustomDays(2.6)).toBe(3);
    expect(clampCustomDays(0)).toBe(1);
    expect(clampCustomDays(-5)).toBe(1);
    expect(clampCustomDays(8)).toBe(7);
    expect(clampCustomDays(10)).toBe(7);
    expect(clampCustomDays(undefined)).toBe(3);
    expect(clampCustomDays(NaN)).toBe(3);
    expect(clampCustomDays(Infinity)).toBe(3);
  });
});
