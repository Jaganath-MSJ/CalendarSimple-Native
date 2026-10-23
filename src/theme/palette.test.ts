import { getContrastColor } from "../core";
import { PALETTE, resolvePalette } from "./palette";

it("light and dark primary", () => {
  expect(PALETTE.light.primary).toBe("#2563eb");
  expect(PALETTE.dark.onPrimary).toBe("#111827");
});
it("overrides one token per scheme", () => {
  const p = resolvePalette("dark", { dark: { primary: "#ff0000" } });
  expect(p.primary).toBe("#ff0000");
  expect(p.bg).toBe("#111827");
});
it("ignores the other scheme's overrides", () =>
  expect(
    resolvePalette("light", { dark: { primary: "#ff0000" } }).primary,
  ).toBe("#2563eb"));
it("default event colour reads white text (contrast)", () =>
  expect(getContrastColor(PALETTE.light.eventDefault)).toBe("#FFFFFF"));
