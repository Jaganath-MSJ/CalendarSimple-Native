import { placePopover } from "./placePopover";

const vp = { width: 1194, height: 834 };
const size = { width: 220, height: 200 };

it("opens below the anchor", () =>
  expect(
    placePopover({ x: 100, y: 100, width: 80, height: 22 }, size, vp),
  ).toEqual({ left: 100, top: 126 }));

it("moves left at the right edge", () =>
  expect(
    placePopover({ x: 1100, y: 100, width: 80, height: 22 }, size, vp).left,
  ).toBe(1194 - 10 - 220));

it("keeps the left padding", () =>
  expect(
    placePopover({ x: 2, y: 100, width: 80, height: 22 }, size, vp).left,
  ).toBe(10));

it("flips above when there is more room above", () =>
  expect(
    placePopover(
      { x: 690, y: 650, width: 80, height: 22 },
      { width: 220, height: 284 },
      vp,
    ).top,
  ).toBe(650 - 4 - 284));

it("caps height when neither side fits", () => {
  const p = placePopover(
    { x: 10, y: 300, width: 80, height: 22 },
    { width: 220, height: 900 },
    vp,
  );
  expect(p.maxHeight).toBeDefined();
  expect(p).toEqual({ left: 10, top: 326, maxHeight: 834 - 10 - 326 });
});

it("caps above when the top side is larger", () =>
  expect(
    placePopover(
      { x: 10, y: 600, width: 80, height: 22 },
      { width: 220, height: 900 },
      vp,
    ),
  ).toEqual({ left: 10, top: 10, maxHeight: 600 - 4 - 10 }));
