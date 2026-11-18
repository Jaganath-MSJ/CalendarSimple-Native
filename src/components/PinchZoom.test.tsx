import { ScrollView, View } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "./Calendar";
import {
  GestureAdapterProvider,
  type ZoomWrapperProps,
} from "../context/GestureAdapterContext";
import type { CalendarEvent } from "../types";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

/** Every render's props, latest last. */
const seen: ZoomWrapperProps[] = [];
function FakePinch(props: ZoomWrapperProps) {
  seen.push(props);
  return <View testID="fake-pinch">{props.children}</View>;
}
const ADAPTER = { TimeGridWrapper: FakePinch };
beforeEach(() => {
  seen.length = 0;
});
const latest = () => seen.at(-1);

const oct22 = new Date(2026, 9, 22);
const meeting: CalendarEvent = {
  id: "m",
  title: "Meeting",
  startDate: "2026-10-22T09:00:00",
  endDate: "2026-10-22T10:00:00",
};
const item = () => screen.getByTestId("calendar-m-day-event-item");

async function zoom(to: number, focalY = 540) {
  await act(() => {
    latest()!.onZoomStart();
    latest()!.onZoomEnd(to, focalY);
  });
}

it("pinching lays the grid out at the new hour height", async () => {
  const onHourHeightChange = jest.fn();
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
        onHourHeightChange={onHourHeightChange}
      />
    </GestureAdapterProvider>,
  );
  expect(latest()).toMatchObject({
    hourHeight: 60,
    minHourHeight: 30,
    maxHourHeight: 180,
  });
  expect(item()).toHaveStyle({ top: 540, height: 60 });
  await zoom(120);
  expect(onHourHeightChange).toHaveBeenCalledWith(120);
  expect(latest()!.hourHeight).toBe(120);
  expect(item()).toHaveStyle({ top: 1080, height: 120 });
});

it("keeps the zoom across navigation and views", async () => {
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
      />
    </GestureAdapterProvider>,
  );
  await zoom(90);
  await fireEvent.press(screen.getByTestId("calendar-header-next-btn"));
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(/23/);
  expect(latest()!.hourHeight).toBe(90);
});

it("a controlled hourHeight only changes through the prop", async () => {
  const onHourHeightChange = jest.fn();
  const { rerender } = await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
        hourHeight={80}
        onHourHeightChange={onHourHeightChange}
      />
    </GestureAdapterProvider>,
  );
  expect(item()).toHaveStyle({ height: 80 });
  await zoom(160);
  expect(onHourHeightChange).toHaveBeenCalledWith(160);
  expect(item()).toHaveStyle({ height: 80 });
  await rerender(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
        hourHeight={160}
        onHourHeightChange={onHourHeightChange}
      />
    </GestureAdapterProvider>,
  );
  expect(item()).toHaveStyle({ top: 9 * 160, height: 160 });
});

it("hourHeight works without pinching or the gestures entry", async () => {
  await renderCalendar(
    <Calendar
      view="week"
      selectedDate={oct22}
      events={[meeting]}
      hourHeight={100}
    />,
  );
  expect(item()).toHaveStyle({ top: 900, height: 100 });
});

it("pauses scrolling during a pinch and ignores an unchanged height", async () => {
  const onHourHeightChange = jest.fn();
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
        minHourHeight={40}
        maxHourHeight={150}
        onHourHeightChange={onHourHeightChange}
      />
    </GestureAdapterProvider>,
  );
  expect(latest()).toMatchObject({ minHourHeight: 40, maxHourHeight: 150 });
  const scroll = () => screen.getByTestId("calendar-time-grid-scroll");
  await act(() => latest()!.onZoomStart());
  expect(scroll().props.scrollEnabled).toBe(false);
  await act(() => latest()!.onZoomEnd(60, 300));
  expect(scroll().props.scrollEnabled).toBe(true);
  expect(onHourHeightChange).not.toHaveBeenCalled();
});

it("no wrapper without pinchToZoom, and none on neighbour pages", async () => {
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar view="week" selectedDate={oct22} events={[meeting]} />
    </GestureAdapterProvider>,
  );
  expect(seen).toHaveLength(0);
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="week"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
      />
    </GestureAdapterProvider>,
  );
  // Swipe is on (iOS / Android): three pages, one wrapper (the current one).
  expect(screen.getAllByTestId("fake-pinch")).toHaveLength(1);
});

it("keeps the hour under the fingers in place after zooming", async () => {
  await renderCalendar(
    <GestureAdapterProvider value={ADAPTER}>
      <Calendar
        view="day"
        selectedDate={oct22}
        events={[meeting]}
        pinchToZoom
      />
    </GestureAdapterProvider>,
  );
  const scroll = screen.getByTestId("calendar-time-grid-scroll");
  await fireEvent.scroll(scroll, {
    nativeEvent: { contentOffset: { x: 0, y: 300 } },
  });
  const scrollTo = jest.spyOn(
    ScrollView.prototype as { scrollTo: () => void },
    "scrollTo",
  );
  await zoom(120, 500);
  // The content point at 500 doubles to 1000: scroll by 500 to keep it put.
  expect(scrollTo).toHaveBeenCalledWith({ y: 800, animated: false });
  scrollTo.mockRestore();
});
