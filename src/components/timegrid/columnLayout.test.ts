import { getColumnLayout } from "./columnLayout";

it.each([
  [
    { width: 390, days: 7, swipe: true, breakpoint: "phone" },
    { colWidth: 330 / 7, scrollable: false, snap: false },
  ],
  [
    { width: 390, days: 7, swipe: false, breakpoint: "phone" },
    { colWidth: 300, scrollable: true, snap: true },
  ],
  [
    { width: 600, days: 7, swipe: false, breakpoint: "compact" },
    { colWidth: 100, scrollable: true, snap: false },
  ],
  [
    { width: 1194, days: 7, swipe: false, breakpoint: "wide" },
    { colWidth: 1134 / 7, scrollable: false, snap: false },
  ],
] as const)("%o", (input, out) => expect(getColumnLayout(input)).toEqual(out));
