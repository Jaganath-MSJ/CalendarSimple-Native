import { positionEvent } from "./positionEvent";

it("maps minutes and percentages to pixels", () => {
  const l = {
    event: {} as never,
    top: 660,
    height: 60,
    left: 50,
    width: 50,
    zIndex: 2,
  };
  expect(positionEvent(l, 330, 60)).toEqual({
    top: 660,
    height: 60,
    left: 165,
    width: 163,
    zIndex: 2,
  });
  expect(positionEvent(l, 330, 90).top).toBe(990); // hourHeight changes only the scale
});
