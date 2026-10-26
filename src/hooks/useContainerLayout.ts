/**
 * @file Measured container size (TDD §8.1 step 2).
 */
import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * Stores `{ width, height }` from `onLayout`. Explicit numeric sizes are used
 * as-is and skip measuring; until a layout arrives the size is 0.
 */
export function useContainerLayout(
  fixedWidth?: number,
  fixedHeight?: number,
): {
  width: number;
  height: number;
  onLayout: (e: LayoutChangeEvent) => void;
} {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);
  return {
    width: fixedWidth ?? size.width,
    height: fixedHeight ?? size.height,
    onLayout,
  };
}
