import { applyDefaults } from "./applyDefaults";

it("#13: explicit undefined keeps the default", () =>
  expect(applyDefaults({ minHour: undefined }).minHour).toBe(0));
it("derives weekEndsOn from weekStartsOn", () => {
  expect(applyDefaults({}).weekEndsOn).toBe(6);
  expect(applyDefaults({ weekStartsOn: 1 }).weekEndsOn).toBe(0);
  expect(applyDefaults({ weekStartsOn: 1, weekEndsOn: 5 }).weekEndsOn).toBe(5);
});
it("resolves locale options", () => {
  expect([0, 1]).toContain(
    applyDefaults({ weekStartsOn: "locale", locale: "en-GB" }).weekStartsOn,
  );
  expect(
    typeof applyDefaults({ is12Hour: "locale", locale: "en-US" }).is12Hour,
  ).toBe("boolean");
});
it("swipe is on for native and off for web", () => {
  expect(applyDefaults({}, "ios").swipeNavigation).toBe(true);
  expect(applyDefaults({}, "web").swipeNavigation).toBe(false);
  expect(applyDefaults({ swipeNavigation: true }, "web").swipeNavigation).toBe(
    true,
  );
});
it("merges messages key by key", () => {
  const c = applyDefaults({ localeMessages: { today: "Hoy" } });
  expect([c.messages.today, c.messages.week]).toEqual(["Hoy", "Week"]);
});
it("defaults for new props", () => {
  const c = applyDefaults({});
  expect([
    c.scheduleDays,
    c.slotPressMode,
    c.showMorePopover,
    c.maxFontSizeMultiplier,
    c.testID,
  ]).toEqual([30, "press", true, 1.5, "calendar"]);
});
