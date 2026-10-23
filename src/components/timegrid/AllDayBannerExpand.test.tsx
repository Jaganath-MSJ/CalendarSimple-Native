import { act, fireEvent, screen } from "@testing-library/react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { getMetrics } from "../../theme";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

const week = () =>
  renderCalendar(
    <Calendar
      view="week"
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
    />,
  );
const { rowHeight } = getMetrics("phone", 2).banner;

it("collapsed: 3 rows, +2 on Thursday, height for 4 rows", async () => {
  await week();
  const more = screen.getByTestId("calendar-4-all-day-more-chip");
  expect(more).toHaveTextContent("+2");
  expect(more.props.accessibilityLabel).toBe(
    "2 more all-day events, tap to expand",
  );
  expect(screen.queryByTestId("calendar-o17-all-day-event")).toBeNull(); // Sam's birthday hidden
  expect(screen.getByTestId("calendar-all-day-banner")).toHaveStyle({
    height: 4 * rowHeight + 4,
  });
  expect(screen.getByTestId("calendar-all-day-expand-icon")).toHaveProp(
    "accessibilityState",
    expect.objectContaining({ expanded: false }),
  );
});

it("expands from the chevron and from +N", async () => {
  await week();
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-all-day-expand-icon")),
  );
  expect(screen.getByTestId("calendar-o17-all-day-event")).toBeOnTheScreen();
  expect(screen.getByTestId("calendar-all-day-banner")).toHaveStyle({
    height: 5 * rowHeight + 4,
  });
  const icon = screen.getByTestId("calendar-all-day-expand-icon");
  expect(icon).toHaveProp(
    "accessibilityState",
    expect.objectContaining({ expanded: true }),
  );
  expect(icon.props.accessibilityLabel).toBe("Collapse all-day events");
  await act(() => fireEvent.press(icon));
  expect(screen.queryByTestId("calendar-o17-all-day-event")).toBeNull();
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-4-all-day-more-chip")),
  );
  expect(screen.getByTestId("calendar-o17-all-day-event")).toBeOnTheScreen();
});

it("collapses again after navigation", async () => {
  await week();
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-4-all-day-more-chip")),
  );
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-header-next-btn")),
  );
  await act(() =>
    fireEvent.press(screen.getByTestId("calendar-header-prev-btn")),
  );
  expect(screen.queryByTestId("calendar-o17-all-day-event")).toBeNull();
});
