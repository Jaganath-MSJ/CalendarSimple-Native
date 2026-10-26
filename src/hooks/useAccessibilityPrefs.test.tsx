import { AccessibilityInfo } from "react-native";
import { act, render, waitFor } from "@testing-library/react-native";
import { useReduceMotion } from "./useReduceMotion";
import { useScreenReader } from "./useScreenReader";

afterEach(() => jest.restoreAllMocks());

it("reads Reduce Motion and screen reader state", async () => {
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(true);
  jest
    .spyOn(AccessibilityInfo, "isScreenReaderEnabled")
    .mockResolvedValue(true);
  let rm = false,
    sr = false;
  const Probe = () => {
    rm = useReduceMotion();
    sr = useScreenReader();
    return null;
  };
  await render(<Probe />);
  await waitFor(() => expect([rm, sr]).toEqual([true, true]));
});

it("follows the change events", async () => {
  const listeners: Record<string, (v: boolean) => void> = {};
  jest
    .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, "isScreenReaderEnabled")
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, "addEventListener")
    .mockImplementation((name: string, l: unknown) => {
      listeners[name] = l as (v: boolean) => void;
      return { remove: jest.fn() };
    });
  let rm = false,
    sr = false;
  const Probe = () => {
    rm = useReduceMotion();
    sr = useScreenReader();
    return null;
  };
  await render(<Probe />);
  await act(() => {
    listeners.reduceMotionChanged?.(true);
    listeners.screenReaderChanged?.(true);
  });
  expect([rm, sr]).toEqual([true, true]);
});
