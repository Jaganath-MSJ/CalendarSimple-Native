import { test, expect, type Page } from "@playwright/test";

// Keyboard navigation on react-native-web (keyboardNavigation, default on).
// Fixed clock: today is 22 Oct 2026, as in the screenshot specs.
test.use({ timezoneId: "UTC", reducedMotion: "reduce" });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-22T10:40:00Z"));
  await page.setViewportSize({ width: 1194, height: 844 });
});

const focusedTestID = (page: Page) =>
  page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
const byID = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const title = (page: Page) => byID(page, "calendar-header-title");

test("month grid: one tab stop, arrows move focus and cross months", async ({
  page,
}) => {
  await page.goto("/?screen=month&scheme=light");
  const cells = page.locator('[data-testid$="-month-cell"]');
  await expect(cells.first()).toBeVisible();
  await expect(
    page.locator('[data-testid$="-month-cell"][tabindex="0"]'),
  ).toHaveCount(1);

  await byID(page, "calendar-22-month-cell").focus();
  await page.keyboard.press("ArrowRight");
  expect(await focusedTestID(page)).toBe("calendar-23-month-cell");
  await page.keyboard.press("ArrowUp");
  expect(await focusedTestID(page)).toBe("calendar-16-month-cell");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(title(page)).toHaveText("November 2026");
  expect(await focusedTestID(page)).toBe("calendar-6-month-cell");
  await page.keyboard.press("PageUp");
  await expect(title(page)).toHaveText("October 2026");
  expect(await focusedTestID(page)).toBe("calendar-6-month-cell");
  await page.keyboard.press("t");
  expect(await focusedTestID(page)).toBe("calendar-22-month-cell");
});

test("Tab reaches one day of the grid, in reading order", async ({ page }) => {
  await page.goto("/?screen=month&scheme=light");
  await byID(page, "calendar-header-year-select").focus();
  // Each week's event chips follow its days in the DOM, so Tab passes the
  // earlier weeks' events, then the grid's single day stop.
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const id = (await focusedTestID(page)) ?? "";
    seen.push(id);
    if (id.endsWith("-month-cell")) break;
  }
  expect(seen.filter((id) => id.endsWith("-month-cell"))).toEqual([
    "calendar-22-month-cell",
  ]);
  expect(
    seen
      .slice(0, -1)
      .every(
        (id) => id.endsWith("-month-event-item") || id.endsWith("-more-events"),
      ),
  ).toBe(true);
});

test("Escape closes the +N popover and returns focus", async ({ page }) => {
  await page.goto("/?screen=month&scheme=light");
  const more = byID(page, "calendar-22-more-events");
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(byID(page, "calendar-popover")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(byID(page, "calendar-popover")).toHaveCount(0);
  await expect(more).toBeFocused();
});

test("week: PageDown, ← / → and T turn the period", async ({ page }) => {
  await page.goto("/?screen=week&scheme=light");
  await page.locator('[data-testid$="-day-event-item"]').first().focus();
  // 18–24 Oct → 25–31 Oct → 1–7 Nov; focus stays in the view between keys.
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageDown");
  await expect(title(page)).toHaveText("November 2026");
  expect(await focusedTestID(page)).toBe("calendar-week-view");
  await page.keyboard.press("ArrowLeft");
  await expect(title(page)).toHaveText("October 2026");
  await page.keyboard.press("ArrowRight");
  await expect(title(page)).toHaveText("November 2026");
  await page.keyboard.press("t");
  await expect(title(page)).toHaveText("October 2026");
});

test("schedule: PageDown keeps focus in the list", async ({ page }) => {
  await page.goto("/?screen=schedule&scheme=light");
  await page.locator('[data-testid$="-schedule-event"]').first().focus();
  await page.keyboard.press("PageDown");
  await page.keyboard.press("ArrowDown");
  await expect(
    page.locator('[data-testid$="-schedule-event"]').first(),
  ).toBeFocused();
});

test("schedule: ↓ and ↑ move between rows", async ({ page }) => {
  await page.goto("/?screen=schedule&scheme=light");
  const rows = page.locator('[data-testid$="-schedule-event"]');
  await rows.nth(0).focus();
  await page.keyboard.press("ArrowDown");
  await expect(rows.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(rows.nth(2)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(rows.nth(1)).toBeFocused();
});

test("phone: Enter opens the day sheet, Escape closes it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?screen=month&scheme=light");
  const cell = byID(page, "calendar-22-month-cell");
  await cell.focus();
  await page.keyboard.press("Enter");
  await expect(byID(page, "calendar-day-sheet")).toBeVisible();
  // The modal takes focus once its slide-in ends; Escape works from then on.
  await expect(cell).not.toBeFocused();
  await page.keyboard.press("Escape");
  await expect(byID(page, "calendar-day-sheet")).toHaveCount(0);
  await expect(cell).toBeFocused();
  await page.keyboard.press(" ");
  await expect(byID(page, "calendar-day-sheet")).toBeVisible();
});

test("event keys: Alt+arrows move, Alt+Shift+↓ resizes, focus stays", async ({
  page,
}) => {
  await page.goto("/?screen=drag&scheme=light");
  const item = byID(page, "calendar-review-day-event-item");
  await item.focus();
  await expect(item).toHaveAttribute(
    "aria-keyshortcuts",
    "Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowUp Alt+Shift+ArrowDown",
  );
  await page.keyboard.press("Alt+ArrowDown");
  await expect(
    page.getByText("Design review → Thu 22 Oct 10:15 (week)"),
  ).toBeVisible();
  await expect(item).toBeFocused();
  // Redrawn in the next day's column: the new element takes focus.
  await page.keyboard.press("Alt+ArrowRight");
  await expect(
    page.getByText("Design review → Fri 23 Oct 10:15 (week)"),
  ).toBeVisible();
  await expect(byID(page, "calendar-review-day-event-item")).toBeFocused();
  await page.keyboard.press("Alt+Shift+ArrowDown");
  await expect(page.getByText(/Design review ⇕ 10:15–11:30/)).toBeVisible();
});
