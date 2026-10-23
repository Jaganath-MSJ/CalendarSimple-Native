import { AccessibilityInfo, Animated } from "react-native";
import { act, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";

const reduceMotion = (on: boolean) =>
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(on);

afterEach(() => jest.restoreAllMocks());

const fadeCall = expect.objectContaining({
  toValue: 1,
  duration: 150,
  useNativeDriver: true,
}) as unknown;

it("keeps events visible but blocks input while loading", async () => {
  reduceMotion(false);
  const onEventClick = jest.fn();
  await renderCalendar(
    <Calendar
      view="day"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      isLoading
      onEventClick={onEventClick}
    />,
  );
  const overlay = screen.getByTestId("calendar-loading-overlay");
  expect(overlay).toHaveProp("pointerEvents", "none");
  expect(overlay).toHaveProp("accessibilityState", { busy: true });
  expect(overlay).not.toHaveStyle({ opacity: 0.5 });
  expect(screen.getByTestId("calendar-o20-day-event-item")).toBeOnTheScreen();
  expect(screen.queryByTestId("time-grid-skeleton")).toBeNull();
});

it("fades in for 150 ms when loading ends", async () => {
  reduceMotion(false);
  const timing = jest.spyOn(Animated, "timing");
  const r = await renderCalendar(<Calendar events={[]} isLoading />);
  await act(async () => {});
  await r.rerender(<Calendar events={OCT_2026_EVENTS} isLoading={false} />);
  expect(timing).toHaveBeenCalledWith(expect.anything(), fadeCall);
  expect(screen.queryByTestId("calendar-loading-overlay")).toBeNull();
});

it("appears instantly under Reduce Motion", async () => {
  reduceMotion(true);
  const timing = jest.spyOn(Animated, "timing");
  const r = await renderCalendar(<Calendar events={[]} isLoading />);
  await act(async () => {});
  await r.rerender(<Calendar events={OCT_2026_EVENTS} isLoading={false} />);
  expect(timing).not.toHaveBeenCalledWith(expect.anything(), fadeCall);
});

it("does not fade on first render", async () => {
  reduceMotion(false);
  const timing = jest.spyOn(Animated, "timing");
  await renderCalendar(<Calendar events={OCT_2026_EVENTS} />);
  expect(timing).not.toHaveBeenCalledWith(expect.anything(), fadeCall);
});
