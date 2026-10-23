import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import Calendar from "../../index";
import { momentumEndOn, renderCalendar } from "../../test-utils/renderCalendar";
import { PeriodPager } from "./PeriodPager";

const W = 390;
const momentumEnd = (x: number) => momentumEndOn("t-pager", x);
const page = (o: number) => <Text>{`page ${o}`}</Text>;

it("renders only the current page when disabled", async () => {
  await render(
    <PeriodPager
      enabled={false}
      width={W}
      testID="t"
      renderPage={page}
      onPage={jest.fn()}
    />,
  );
  expect(screen.getByText("page 0")).toBeOnTheScreen();
  expect(screen.queryByText("page 1")).toBeNull();
  expect(screen.queryByTestId("t-pager")).toBeNull();
});

it("calls onPage(+1) / (-1) at the outer pages and nothing in the middle", async () => {
  const onPage = jest.fn();
  await render(
    <PeriodPager
      enabled
      width={W}
      testID="t"
      renderPage={page}
      onPage={onPage}
    />,
  );
  await momentumEnd(2 * W);
  await momentumEnd(0);
  await momentumEnd(W);
  expect(onPage.mock.calls).toEqual([[1], [-1]]);
});

it("renders the neighbour pages after the first idle period", async () => {
  await render(
    <PeriodPager
      enabled
      width={W}
      testID="t"
      renderPage={page}
      onPage={jest.fn()}
    />,
  );
  expect(screen.getByText("page 0")).toBeOnTheScreen();
  // Page -1 sits before initialScrollIndex, so FlatList only mounts it once
  // the list has a real layout; the next page proves the idle gate opened.
  expect(await screen.findByText("page 1")).toBeOnTheScreen();
});

it("review focus 4: five swipes through the Calendar land five months on", async () => {
  // Compound children replace the body, so the probe is a header render prop.
  let current: Date | undefined;
  const onNavigate = jest.fn<void, [Date]>();
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      swipeNavigation
      onNavigate={onNavigate}
      renderHeader={({ currentDate }) => {
        current = currentDate;
        return null;
      }}
    />,
  );
  for (let i = 0; i < 5; i++) await momentumEndOn("calendar-pager", 2 * W);
  expect(current?.toDateString()).toBe(new Date(2027, 2, 22).toDateString());
  expect(onNavigate).toHaveBeenCalledTimes(5);
  expect(onNavigate.mock.calls.at(-1)![0].toDateString()).toBe(
    new Date(2027, 2, 22).toDateString(),
  );
});

it("disables the pager in schedule view", async () => {
  await renderCalendar(<Calendar swipeNavigation view="schedule" />);
  expect(screen.queryByTestId("calendar-pager")).toBeNull();
  expect(screen.getByTestId("calendar-body")).toBeOnTheScreen();
});
