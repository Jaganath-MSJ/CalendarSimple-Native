import { test, expect } from "@playwright/test";

// Deterministic pixels: a fixed clock (the examples' 22 Oct 2026, so today,
// the now-line and the auto-scroll never move), a fixed zone and no motion.
test.use({ timezoneId: "UTC", reducedMotion: "reduce" });
test.skip(
  process.platform !== "darwin",
  "baselines are macOS-only until Linux baselines are generated",
);
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T10:40:00Z"));
});

for (const screen of ["month", "week", "day", "3days", "schedule"])
  for (const scheme of ["light", "dark"])
    for (const width of [390, 1194]) {
      test(`${screen} ${scheme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/?screen=${screen}&scheme=${scheme}`);
        await expect(page.getByTestId("calendar-container")).toBeVisible();
        await expect(page).toHaveScreenshot(
          `${screen}-${scheme}-${width}.png`,
          { maxDiffPixelRatio: 0.01 },
        );
      });
    }
