import { test, expect, type Locator, type Page } from "@playwright/test";

// Drag to move and resize on react-native-web with the gestures entry (example "Move
// events" screen): a long press lifts the event, the pan moves it in steps.
test.use({ timezoneId: "UTC", reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T10:40:00Z"));
  await page.setViewportSize({ width: 1194, height: 844 });
  await page.goto("/?screen=drag&scheme=light");
});

/**
 * Long-presses `target` at `at` (0 top … 1 bottom; the middle moves, the
 * edges resize), drags by (dx, dy) in small moves and releases.
 */
async function drag(
  page: Page,
  target: Locator,
  dx: number,
  dy: number,
  at = 0.5,
) {
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  const x = box.x + Math.min(40, box.width / 2);
  const y = box.y + Math.min(box.height - 3, Math.max(3, box.height * at));
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(450); // longer than the 250 ms long press
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10);
  await page.mouse.up();
}

test("week: drag an event a day later and an hour later", async ({ page }) => {
  const item = page.locator('[data-testid="calendar-review-day-event-item"]');
  const column = (await item.boundingBox())!.width + 2;
  await drag(page, item, column, 60);
  await expect(
    page.getByText("Design review → Fri 23 Oct 11:00 (week)"),
  ).toBeVisible();
});

test("week: events that are not draggable stay put", async ({ page }) => {
  const locked = page.locator('[data-testid="calendar-locked-day-event-item"]');
  await drag(page, locked, 0, 60);
  await expect(page.getByText(/→/)).toHaveCount(0);
});

test("month: drag a chip to the next day", async ({ page }) => {
  await page.getByRole("button", { name: "Month", exact: true }).click();
  const chip = page.locator('[data-testid="calendar-review-month-event-item"]');
  const cell = page.locator('[data-testid="calendar-22-month-cell"]');
  const width = (await cell.boundingBox())!.width;
  await drag(page, chip, width, 0);
  await expect(
    page.getByText("Design review → Fri 23 Oct 10:00 (month)"),
  ).toBeVisible();
});

test("week: drag the bottom edge to make an event longer", async ({ page }) => {
  const item = page.locator('[data-testid="calendar-review-day-event-item"]');
  await drag(page, item, 0, 30, 1);
  await expect(
    page.getByText("Design review ⇕ 10:00–11:30 (bottom)"),
  ).toBeVisible();
});

test("week: drag the top edge to start earlier", async ({ page }) => {
  const item = page.locator('[data-testid="calendar-review-day-event-item"]');
  await drag(page, item, 0, -60, 0);
  await expect(
    page.getByText("Design review ⇕ 09:00–11:00 (top)"),
  ).toBeVisible();
});
