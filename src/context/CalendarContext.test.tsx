import { act, render } from "@testing-library/react-native";
import { dateFn } from "../core";
import { applyDefaults } from "../config/applyDefaults";
import { useCalendarProps } from "../hooks/useCalendarProps";
import {
  CalendarProvider,
  useCalendar,
  useCalendarConfig,
} from "./CalendarContext";

// RNTL 14: `render` is async, so the throw surfaces as a rejection.
it("throws outside a provider", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  const Probe = () => {
    useCalendar();
    return null;
  };
  await expect(render(<Probe />)).rejects.toThrow(
    "useCalendar must be used within a CalendarProvider",
  );
  spy.mockRestore();
});

it("dispatch updates state", async () => {
  let api!: ReturnType<typeof useCalendar>;
  const Probe = () => {
    api = useCalendar();
    return null;
  };
  await render(
    <CalendarProvider
      initialDate={dateFn("2026-10-22")}
      initialView="month"
      config={applyDefaults({})}
    >
      <Probe />
    </CalendarProvider>,
  );
  await act(() => api.dispatch({ type: "NEXT" }));
  expect(api.state.selectedDate.toISODate()).toBe("2026-11-22");
});

it("useCalendarProps lets defined local props win", async () => {
  let merged!: ReturnType<typeof useCalendarProps>;
  const Probe = () => {
    merged = useCalendarProps({ minHour: 8, maxHour: undefined });
    return null;
  };
  await render(
    <CalendarProvider
      initialDate={dateFn("2026-10-22")}
      initialView="week"
      config={applyDefaults({ maxHour: 20 })}
    >
      <Probe />
    </CalendarProvider>,
  );
  expect([merged.minHour, merged.maxHour]).toEqual([8, 20]);
});

it("config consumers do not re-render on navigation", async () => {
  let configRenders = 0;
  let api!: ReturnType<typeof useCalendar>;
  const ConfigOnly = () => {
    useCalendarConfig();
    configRenders += 1;
    return null;
  };
  const Probe = () => {
    api = useCalendar();
    return null;
  };
  const config = applyDefaults({});
  const configChild = <ConfigOnly />;
  await render(
    <CalendarProvider
      initialDate={dateFn("2026-10-22")}
      initialView="month"
      config={config}
    >
      {configChild}
      <Probe />
    </CalendarProvider>,
  );
  const before = configRenders;
  await act(() => api.dispatch({ type: "NEXT" }));
  expect(configRenders).toBe(before);
});
