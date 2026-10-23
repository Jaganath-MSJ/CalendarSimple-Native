import { resolveFlip } from "./flip";

// Index review: RTL app with an LTR calendar must not mirror twice.
it.each([
  ["rtl", false, true],
  ["ltr", false, false],
  ["ltr", true, true],
  ["rtl", true, false],
] as const)("%s with app RTL=%s → flip %s", (d, app, out) =>
  expect(resolveFlip(d, app)).toBe(out),
);
