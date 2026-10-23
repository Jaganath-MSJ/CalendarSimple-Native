import { test, expect } from "@playwright/test";

test("example web build loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("calendar-simple-native examples")).toBeVisible();
});
