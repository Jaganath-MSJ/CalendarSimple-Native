/**
 * @file Render helpers that simulate native layout for the calendar root.
 */
import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

export type RenderCalendarResult = Awaited<ReturnType<typeof render>>;

/**
 * Renders `ui`, then fires `layout` on the root container (`<testID>-container`,
 * default `"calendar"`) so content that waits for a measured width appears.
 */
export async function renderCalendar(
  ui: ReactElement,
  size: { width: number; height: number } = { width: 390, height: 844 },
  testID = "calendar",
): Promise<RenderCalendarResult> {
  const result = await render(ui);
  await fireEvent(screen.getByTestId(`${testID}-container`), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, ...size } },
  });
  return result;
}

/** Ends a horizontal momentum scroll at `x` on the element with `testID`. */
export async function momentumEndOn(testID: string, x: number): Promise<void> {
  await fireEvent(screen.getByTestId(testID), "momentumScrollEnd", {
    nativeEvent: { contentOffset: { x, y: 0 } },
  });
}

/** A whole user swipe: the drag starts, then the momentum ends at `x`. */
export async function swipeOn(testID: string, x: number): Promise<void> {
  await fireEvent(screen.getByTestId(testID), "scrollBeginDrag", {
    nativeEvent: { contentOffset: { x, y: 0 } },
  });
  await momentumEndOn(testID, x);
}
