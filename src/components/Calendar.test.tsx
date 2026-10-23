import * as RN from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Calendar, { useCalendar } from "../index";
import { useCalendarTheme } from "../theme";
import { renderCalendar } from "../test-utils/renderCalendar";

afterEach(() => jest.restoreAllMocks());

it("validates events and warns once in development", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  let api!: ReturnType<typeof useCalendar>;
  const Probe = () => {
    api = useCalendar();
    return null;
  };
  const events = [
    { id: "a", title: "a", startDate: "2026-10-22" },
    { id: "b", title: "b", startDate: "nope" },
  ];
  const r = await renderCalendar(
    <Calendar events={events}>
      <Probe />
    </Calendar>,
  );
  expect(api.config.events.map((e) => e.id)).toEqual(["a"]);
  expect(warn).toHaveBeenCalledWith(
    "[calendar] dropped 1 event(s) with an invalid startDate or endDate.",
  );
  await r.rerender(
    <Calendar events={events}>
      <Probe />
    </Calendar>,
  );
  expect(warn).toHaveBeenCalledTimes(1);
});

it("renders the body only after layout", async () => {
  await render(<Calendar />);
  expect(screen.queryByTestId("calendar-body")).toBeNull();
  await fireEvent(screen.getByTestId("calendar-container"), "layout", {
    nativeEvent: { layout: { width: 390, height: 844 } },
  });
  expect(screen.getByTestId("calendar-body")).toBeOnTheScreen();
});

it("does not render the body for a zero-width layout", async () => {
  await renderCalendar(<Calendar />, { width: 0, height: 0 });
  expect(screen.queryByTestId("calendar-body")).toBeNull();
});

it("explicit numeric width and height skip waiting for layout", async () => {
  let bp = "";
  const Probe = () => {
    bp = useCalendarTheme().breakpoint;
    return null;
  };
  await render(
    <Calendar width={1024} height={700}>
      <Probe />
    </Calendar>,
  );
  expect(bp).toBe("wide");
});

it("derives the breakpoint from the measured width", async () => {
  let bp = "";
  const Probe = () => {
    bp = useCalendarTheme().breakpoint;
    return null;
  };
  await renderCalendar(
    <Calendar>
      <Probe />
    </Calendar>,
    { width: 600, height: 800 },
  );
  expect(bp).toBe("compact");
});

it("#11: re-syncs selectedDate by value, not identity (compound mode)", async () => {
  let api!: ReturnType<typeof useCalendar>;
  const Probe = () => {
    api = useCalendar();
    return null;
  };
  const ui = (d: Date) => (
    <Calendar selectedDate={d}>
      <Probe />
    </Calendar>
  );
  const r = await renderCalendar(ui(new Date(2026, 9, 22)));
  await act(() => api.dispatch({ type: "NEXT" }));
  await r.rerender(ui(new Date(2026, 9, 22))); // same value, new object
  expect(api.state.selectedDate.toISODate()).toBe("2026-11-22");
  await r.rerender(ui(new Date(2026, 0, 5))); // new value
  expect(api.state.selectedDate.toISODate()).toBe("2026-01-05");
});

it("syncs view and customDays props", async () => {
  let api!: ReturnType<typeof useCalendar>;
  const Probe = () => {
    api = useCalendar();
    return null;
  };
  const r = await renderCalendar(
    <Calendar view="month">
      <Probe />
    </Calendar>,
  );
  await r.rerender(
    <Calendar view="customDays" customDays={5}>
      <Probe />
    </Calendar>,
  );
  expect(api.state.view).toBe("customDays");
  expect(api.state.customDays).toBe(5);
});

it("#19: keeps the config context stable across parent renders", async () => {
  const configs = new Set<unknown>();
  const Probe = () => {
    configs.add(useCalendar().config);
    return null;
  };
  const onDateClick = () => {};
  const events = [{ title: "a", startDate: "2026-10-22" }];
  const ui = () => (
    <Calendar events={events} onDateClick={onDateClick} locale="en">
      <Probe />
    </Calendar>
  );
  const r = await renderCalendar(ui());
  await r.rerender(ui());
  await r.rerender(ui());
  expect(configs.size).toBe(1);
  await r.rerender(
    <Calendar events={events} onDateClick={onDateClick} locale="fr">
      <Probe />
    </Calendar>,
  );
  expect(configs.size).toBe(2);
});

it("follows the OS scheme when colorScheme is auto", async () => {
  jest.spyOn(RN, "useColorScheme").mockReturnValue("dark");
  let scheme = "";
  const Probe = () => {
    scheme = useCalendar().colorScheme;
    return null;
  };
  await renderCalendar(
    <Calendar>
      <Probe />
    </Calendar>,
  );
  expect(scheme).toBe("dark");
});

it("resolves flip from the locale direction", async () => {
  let flip: boolean | undefined;
  const Probe = () => {
    flip = useCalendarTheme().flip;
    return null;
  };
  await renderCalendar(
    <Calendar locale="ar">
      <Probe />
    </Calendar>,
  );
  expect(flip).toBe(true);
});

it("shows the silent error boundary when a child throws", async () => {
  const Boom = () => {
    throw new Error("x");
  };
  jest.spyOn(console, "error").mockImplementation(() => {});
  await renderCalendar(
    <Calendar>
      <Boom />
    </Calendar>,
  );
  expect(screen.getByTestId("calendar-error-boundary")).toBeOnTheScreen();
});
