import { test, expect, type Page } from "@playwright/test";

// The calendar must fit the space it is given on web, so its time grid and
// schedule list scroll inside it: the page body does not scroll (Expo sets
// `overflow: hidden`), so content past the bottom edge is otherwise lost.
test.use({ timezoneId: "UTC", reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T10:40:00Z"));
});

const scrollTop = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el) => el.scrollTop);

const VIEWS = [
  ["day", "calendar-time-grid-scroll"],
  ["week", "calendar-time-grid-scroll"],
  ["schedule", "calendar-schedule-view"],
] as const;

for (const [screen, scroller] of VIEWS)
  for (const width of [390, 1194]) {
    test(`${screen} ${width}: fits the screen and scrolls`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`/?screen=${screen}`);
      const container = page.getByTestId("calendar-container");
      await expect(container).toBeVisible();

      const box = await container.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(844);

      const list = page.getByTestId(scroller);
      const listBox = await list.boundingBox();
      // Taller content than the box it scrolls in.
      expect(
        await list.evaluate((el) => el.scrollHeight > el.clientHeight),
      ).toBe(true);

      const before = await scrollTop(page, scroller);
      await page.mouse.move(
        listBox!.x + listBox!.width / 2,
        listBox!.y + Math.min(listBox!.height / 2, 200),
      );
      await page.mouse.wheel(0, 400);
      await expect
        .poll(() => scrollTop(page, scroller))
        .toBeGreaterThan(before);
    });
  }
