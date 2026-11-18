import { test, expect, type Page } from "@playwright/test";

// Pinch to zoom on react-native-web with the gestures entry ("Gestures"
// example screen). Playwright has no two-finger gesture, so the touches go
// through the DevTools protocol (Chromium).
test.use({ timezoneId: "UTC", reducedMotion: "reduce", hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T10:40:00Z"));
  await page.setViewportSize({ width: 1194, height: 844 });
  await page.goto("/?screen=drag&scheme=light");
  await page.getByRole("button", { name: "Day", exact: true }).click();
});

/** Two fingers on the day column, `from` → `to` px apart (each side). */
async function pinch(page: Page, from: number, to: number) {
  const col = (await page
    .locator('[data-testid="calendar-day-column"]')
    .boundingBox())!;
  const x = col.x + col.width / 2;
  const y = 560;
  const cdp = await page.context().newCDPSession(page);
  type TouchType = "touchStart" | "touchMove" | "touchEnd";
  const touch = (type: TouchType, d: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints:
        type === "touchEnd"
          ? []
          : [
              { x, y: y - d, id: 1 },
              { x, y: y + d, id: 2 },
            ],
    });
  await touch("touchStart", from);
  const step = (to - from) / 10;
  for (let i = 1; i <= 10; i++) {
    await touch("touchMove", from + step * i);
    await page.waitForTimeout(16);
  }
  await touch("touchEnd", 0);
}

const hourOf = (page: Page) =>
  page
    .locator('[data-testid="calendar-day-column"] > div')
    .first()
    .evaluate((el) => el.getBoundingClientRect().height);

test("spreading two fingers makes the hours taller", async ({ page }) => {
  expect(await hourOf(page)).toBeCloseTo(60, 0);
  await pinch(page, 40, 100);
  await expect(page.getByText(/Hour height: (8|9|1)\d+/)).toBeVisible();
  await expect.poll(() => hourOf(page)).toBeGreaterThan(80);
});

test("pinching in makes them shorter, down to the minimum", async ({
  page,
}) => {
  await pinch(page, 150, 10);
  await expect(page.getByText("Hour height: 30")).toBeVisible();
  await expect.poll(() => hourOf(page)).toBeCloseTo(30, 0);
});
