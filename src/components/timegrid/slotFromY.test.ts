import { slotFromY } from "./slotFromY";

it("maps y to an hour", () => {
  expect(slotFromY(840, 0, 60)).toBe(14);
  expect(slotFromY(0, 8, 60)).toBe(8);
  expect(slotFromY(59, 8, 60)).toBe(8);
});
