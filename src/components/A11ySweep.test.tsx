import { act, fireEvent, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { Calendar } from "./Calendar";
import { OCT_2026_EVENTS } from "../core/test/fixtures";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";
import { findUnlabelledInteractive } from "../test-utils/a11yAudit";

// The test renderer has no native tags, so any mounted opener maps to 42.
// (`react-native` re-exports findNodeHandle through a getter that jest cannot
// spy on; the getter reads it from RendererProxy.)
jest.mock("react-native/Libraries/ReactNative/RendererProxy", () => ({
  ...jest.requireActual<object>(
    "react-native/Libraries/ReactNative/RendererProxy",
  ),
  findNodeHandle: (ref: unknown) => (ref ? 42 : null),
}));

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const untitled = [
  {
    id: "u1",
    title: "",
    startDate: "2026-10-22T09:00:00",
    endDate: "2026-10-22T10:00:00",
  },
  { id: "u2", title: "", startDate: "2026-10-22" },
];

it.each(["month", "week", "day", "customDays", "schedule"] as const)(
  "%s: every interactive element is labelled",
  async (view) => {
    await renderCalendar(
      <Calendar
        view={view}
        selectedDate={new Date(2026, 9, 22)}
        events={[...OCT_2026_EVENTS, ...untitled]}
        creatable
        onSlotClick={jest.fn()}
      />,
    );
    expect(findUnlabelledInteractive(screen.container)).toEqual([]);
  },
);

it.each(["month", "week", "day"] as const)(
  "%s wide: every interactive element is labelled",
  async (view) => {
    await renderCalendar(
      <Calendar
        view={view}
        selectedDate={new Date(2026, 9, 22)}
        events={[...OCT_2026_EVENTS, ...untitled]}
        creatable
        onSlotClick={jest.fn()}
      />,
      { width: 1194, height: 834 },
    );
    expect(findUnlabelledInteractive(screen.container)).toEqual([]);
  },
);

it("the day sheet and the view menu are labelled", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={[...OCT_2026_EVENTS, ...untitled]}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(findUnlabelledInteractive(screen.container)).toEqual([]);
});

it.each([
  ["week", "calendar-u1-day-event-item"],
  ["week", "calendar-u2-all-day-event"],
  ["schedule", "calendar-u1-schedule-event"],
] as const)("#14C: %s %s says No title", async (view, id) => {
  await renderCalendar(
    <Calendar
      view={view}
      selectedDate={new Date(2026, 9, 22)}
      events={untitled}
    />,
  );
  expect(screen.getAllByTestId(id)[0]).toHaveProp(
    "accessibilityLabel",
    expect.stringMatching(/^No title, /),
  );
});

it("sheets are modal for screen readers", async () => {
  await renderCalendar(
    <Calendar selectedDate={new Date(2026, 9, 22)} events={OCT_2026_EVENTS} />,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expect(screen.getByTestId("calendar-day-sheet")).toHaveProp(
    "accessibilityViewIsModal",
    true,
  );
});

describe("focus returns to the opener on close", () => {
  const spyFocus = () => {
    // Drop focus moves scheduled by the previous test's unmount.
    jest.clearAllTimers();
    // jest-expo already mocks it with a jest.fn, which spyOn reuses.
    const focus = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => {});
    focus.mockClear();
    return focus;
  };
  afterEach(() => jest.restoreAllMocks());

  it("day sheet → the month cell", async () => {
    const focus = spyFocus();
    await renderCalendar(
      <Calendar
        selectedDate={new Date(2026, 9, 22)}
        events={OCT_2026_EVENTS}
      />,
    );
    await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
    await act(() => jest.runOnlyPendingTimers());
    expect(focus).not.toHaveBeenCalled();
    await fireEvent(
      screen.getByTestId("calendar-day-sheet-modal"),
      "requestClose",
    );
    await act(() => jest.runOnlyPendingTimers());
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(42);
  });

  it("view menu sheet → the picker button", async () => {
    const focus = spyFocus();
    await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />);
    await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
    await fireEvent.press(screen.getByTestId("calendar-menu-option-week"));
    await act(() => jest.runOnlyPendingTimers());
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(42);
  });

  it("more popover → the more button", async () => {
    const focus = spyFocus();
    await renderCalendar(
      <Calendar
        selectedDate={new Date(2026, 9, 22)}
        events={OCT_2026_EVENTS}
      />,
      { width: 1194, height: 834 },
    );
    await fireEvent.press(screen.getByTestId("calendar-22-more-events"));
    await fireEvent(screen.getByTestId("calendar-popover"), "requestClose");
    await act(() => jest.runOnlyPendingTimers());
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledWith(42);
  });
});
