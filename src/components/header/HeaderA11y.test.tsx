import { act, fireEvent, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Text } from "react-native";
import { DateTime } from "luxon";
import { Calendar } from "../Calendar";
import type { RenderHeaderProps } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

it("renderHeader replaces the header and its handlers navigate", async () => {
  const onNavigate = jest.fn<void, [Date]>();
  let props!: RenderHeaderProps;
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      onNavigate={onNavigate}
      renderHeader={(p) => {
        props = p;
        return <Text>custom</Text>;
      }}
    />,
  );
  expect(screen.queryByTestId("calendar-header")).toBeNull();
  expect(DateTime.fromJSDate(props.currentDate).toISODate()).toBe("2026-10-22");
  await act(() => props.onNavigate(new Date(2026, 11, 1)));
  expect(onNavigate).toHaveBeenCalledTimes(1);
  expect(DateTime.fromJSDate(props.currentDate).toISODate()).toBe("2026-12-01");
});

it("renderHeader onViewChange dispatches then reports", async () => {
  const onViewChange = jest.fn();
  let props!: RenderHeaderProps;
  await renderCalendar(
    <Calendar
      onViewChange={onViewChange}
      renderHeader={(p) => {
        props = p;
        return null;
      }}
    />,
  );
  await act(() => props.onViewChange("week"));
  expect(props.view).toBe("week");
  expect(onViewChange).toHaveBeenCalledWith("week");
});

it("increment/decrement actions page the calendar", async () => {
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />);
  await fireEvent(
    screen.getByTestId("calendar-header-title"),
    "accessibilityAction",
    { nativeEvent: { actionName: "increment" } },
  );
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "November 2026",
  );
  await fireEvent(
    screen.getByTestId("calendar-header-title"),
    "accessibilityAction",
    { nativeEvent: { actionName: "decrement" } },
  );
  expect(screen.getByTestId("calendar-header-title")).toHaveTextContent(
    "October 2026",
  );
});

it("title is one header with paging actions", async () => {
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />);
  const title = screen.getByRole("header");
  expect(title).toHaveTextContent("October 2026");
  expect(title).toHaveProp("accessibilityActions", [
    { name: "increment" },
    { name: "decrement" },
    { name: "next", label: "Next period" },
    { name: "previous", label: "Previous period" },
  ]);
  await fireEvent(title, "accessibilityAction", {
    nativeEvent: { actionName: "next" },
  });
  expect(title).toHaveTextContent("November 2026");
});

it("announces the new title after navigation", async () => {
  // jest-expo already mocks this; clear calls from earlier tests.
  const spy = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
  spy.mockClear();
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />);
  expect(spy).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId("calendar-header-next-btn"));
  expect(spy).toHaveBeenLastCalledWith("November 2026");
});
