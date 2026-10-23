import { act, render } from "@testing-library/react-native";
import type { DateType } from "../core";
import { emitAppState, useFrozenClock } from "../test-utils/clock";
import { useNow } from "./useNow";

it("ticks every minute", async () => {
  useFrozenClock("2026-10-22T10:40:00");
  let now!: DateType;
  const Probe = () => {
    now = useNow();
    return null;
  };
  await render(<Probe />);
  await act(() => jest.advanceTimersByTime(60_000));
  expect(now.toFormat("HH:mm")).toBe("10:41");
});

it("aligns ticks to the minute boundary", async () => {
  useFrozenClock("2026-10-22T10:40:30");
  let now!: DateType;
  const Probe = () => {
    now = useNow();
    return null;
  };
  await render(<Probe />);
  await act(() => jest.advanceTimersByTime(30_000));
  expect(now.toFormat("HH:mm:ss")).toBe("10:41:00");
});

it("review focus 5: refreshes on resume after midnight", async () => {
  useFrozenClock("2026-10-22T23:59:00");
  let now!: DateType;
  const Probe = () => {
    now = useNow();
    return null;
  };
  await render(<Probe />);
  await emitAppState("background");
  jest.setSystemTime(new Date("2026-10-23T08:00:00"));
  await emitAppState("active");
  expect(now.toISODate()).toBe("2026-10-23");
});

it("does not tick while in the background", async () => {
  useFrozenClock("2026-10-22T10:40:00");
  let renders = 0;
  const Probe = () => {
    useNow();
    renders++;
    return null;
  };
  await render(<Probe />);
  await emitAppState("background");
  const before = renders;
  await act(() => jest.advanceTimersByTime(5 * 60_000));
  expect(renders).toBe(before);
});
