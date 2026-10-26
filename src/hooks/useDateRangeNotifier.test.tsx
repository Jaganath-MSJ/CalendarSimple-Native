import type { Dispatch } from "react";
import { act } from "@testing-library/react-native";
import { DateTime } from "luxon";
import Calendar, { useCalendar } from "../index";
import type { CalendarAction, ECalendarViewType } from "../core";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// Not a React hook: registers Jest hooks (name fixed by the plan).
// eslint-disable-next-line react-hooks/rules-of-hooks
useFrozenClock();
const iso = (d: Date) => DateTime.fromJSDate(d).toISODate();
const rangeSpy = () => jest.fn<void, [Date, Date, ECalendarViewType]>();
const tick = () => act(() => jest.advanceTimersByTime(20));

it("fires once on mount with the month grid range", async () => {
  const spy = rangeSpy();
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} onDateRangeChange={spy} />,
  );
  await tick();
  expect(spy).toHaveBeenCalledTimes(1);
  expect([
    iso(spy.mock.calls[0]![0]),
    iso(spy.mock.calls[0]![1]),
    spy.mock.calls[0]![2],
  ]).toEqual(["2026-09-27", "2026-10-31", "month"]);
});

it("review focus 4: five rapid NEXT dispatches fire once with the final range", async () => {
  const spy = rangeSpy();
  let dispatch!: Dispatch<CalendarAction>;
  const Probe = () => {
    dispatch = useCalendar().dispatch;
    return null;
  };
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} onDateRangeChange={spy}>
      <Probe />
    </Calendar>,
  );
  await tick();
  spy.mockClear();
  await act(() => {
    for (let i = 0; i < 5; i++) dispatch({ type: "NEXT" });
  });
  await tick();
  expect(spy).toHaveBeenCalledTimes(1);
  expect(iso(spy.mock.calls[0]![0])).toBe("2027-02-28"); // March 2027 grid starts on Sun 28 Feb
});

it("a newer range within 16 ms cancels the pending call", async () => {
  const spy = rangeSpy();
  let dispatch!: Dispatch<CalendarAction>;
  const Probe = () => {
    dispatch = useCalendar().dispatch;
    return null;
  };
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} onDateRangeChange={spy}>
      <Probe />
    </Calendar>,
  );
  await tick();
  spy.mockClear();
  for (let i = 0; i < 5; i++) {
    await act(() => dispatch({ type: "NEXT" }));
    await act(() => jest.advanceTimersByTime(5));
  }
  await tick();
  expect(spy).toHaveBeenCalledTimes(1);
  expect(iso(spy.mock.calls[0]![0])).toBe("2027-02-28");
});

it("does not fire again when only the callback identity changes", async () => {
  const spy = rangeSpy();
  const r = await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      onDateRangeChange={(s, e, v) => spy(s, e, v)}
    />,
  );
  await tick();
  await r.rerender(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      onDateRangeChange={(s, e, v) => spy(s, e, v)}
    />,
  );
  await tick();
  expect(spy).toHaveBeenCalledTimes(1);
});

it("fires on view change and schedule extension", async () => {
  const spy = rangeSpy();
  let dispatch!: Dispatch<CalendarAction>;
  const Probe = () => {
    dispatch = useCalendar().dispatch;
    return null;
  };
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      view="schedule"
      onDateRangeChange={spy}
    >
      <Probe />
    </Calendar>,
  );
  await tick();
  await act(() => dispatch({ type: "EXTEND_SCHEDULE", payload: 30 }));
  await tick();
  expect(iso(spy.mock.calls.at(-1)![1])).toBe("2026-12-20");
  await act(() => dispatch({ type: "SET_VIEW", payload: "week" }));
  await tick();
  expect(spy.mock.calls.at(-1)![2]).toBe("week");
});
