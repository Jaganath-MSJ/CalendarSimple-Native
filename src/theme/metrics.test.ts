import { getBreakpoint, getMetrics } from "./metrics";

it.each([
  [390, "phone"],
  [480, "phone"],
  [481, "compact"],
  [768, "compact"],
  [769, "wide"],
] as const)("width %i → %s", (w, bp) => expect(getBreakpoint(w)).toBe(bp));
it("wide month label is 24/13", () => {
  const m = getMetrics("wide");
  expect([m.month.labelSize, m.month.labelFontSize]).toEqual([24, 13]);
});
it("phone month uses 6 px bars with pitch 8", () => {
  const m = getMetrics("phone");
  expect([m.month.barHeight, m.month.barPitch]).toEqual([6, 8]);
});
it("font scale is capped", () =>
  expect(getMetrics("wide", 2, 1.5).month.labelFontSize).toBe(19.5));
it("font scale leaves the hour grid alone", () =>
  expect(getMetrics("wide", 2).timeGrid.hourHeight).toBe(60));
it("header fallback height per breakpoint", () => {
  expect(getMetrics("phone").header.height).toBe(113);
  expect(getMetrics("wide").header.height).toBe(69);
});
it("touch target is at least 44", () =>
  expect(getMetrics("phone").touchTarget).toBeGreaterThanOrEqual(44));
