import { getAutoScrollY } from "./autoScroll";

it("#5: subtracts minHour", () => {
  expect(
    getAutoScrollY({
      nowMinutes: 640,
      minHour: 0,
      hourHeight: 60,
      viewportHeight: 600,
    }),
  ).toBe(340);
  expect(
    getAutoScrollY({
      nowMinutes: 640,
      minHour: 8,
      hourHeight: 60,
      viewportHeight: 600,
    }),
  ).toBe(0);
  expect(
    getAutoScrollY({
      nowMinutes: 900,
      minHour: 8,
      hourHeight: 60,
      viewportHeight: 300,
    }),
  ).toBe(270);
});
