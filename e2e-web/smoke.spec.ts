import { test, expect } from "@playwright/test";

test("example web build loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("React Native calendar for iOS, Android and web"),
  ).toBeVisible();
});
