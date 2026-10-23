import { I18nManager, Text } from "react-native";
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

it("renders the placeholder on neighbour pages until idle (TDD §8.5)", async () => {
  await render(
    <PeriodPager
      enabled
      width={W}
      testID="t"
      renderPage={page}
      renderPlaceholder={(o) => <Text>{`skeleton ${o}`}</Text>}
      onPage={jest.fn()}
    />,
  );
  expect(screen.getByText("page 0")).toBeOnTheScreen();
  expect(screen.getByText("skeleton 1")).toBeOnTheScreen();
  expect(screen.queryByText("page 1")).toBeNull();
  expect(await screen.findByText("page 1")).toBeOnTheScreen();
  expect(screen.queryByText("skeleton 1")).toBeNull();
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

describe("RTL swipe direction (TDD §8.1 flip rule)", () => {
  // contentOffset.x is physical (from the left) on iOS and Android; in an
  // RTL app FlatList lays page 0 out on the right.
  afterEach(() => {
    I18nManager.isRTL = false;
  });
  const swipes = async (flip: boolean) => {
    const onPage = jest.fn<void, [1 | -1]>();
    await render(
      <PeriodPager
        enabled
        flip={flip}
        width={W}
        testID="t"
        renderPage={page}
        onPage={onPage}
      />,
    );
    await momentumEnd(0); // the page on the left
    await momentumEnd(2 * W); // the page on the right
    return onPage.mock.calls;
  };

  it.each([
    // [app RTL, calendar flip, left page, right page]
    [false, false, -1, 1], // LTR calendar in an LTR app
    [false, true, 1, -1], // RTL calendar (ar) in an LTR app
    [true, false, 1, -1], // RTL calendar (ar) in an RTL app
    [true, true, -1, 1], // LTR calendar (en) in an RTL app
  ] as const)(
    "app RTL %s, flip %s: left → %s, right → %s",
    async (rtl, flip, left, right) => {
      I18nManager.isRTL = rtl;
      expect(await swipes(flip)).toEqual([[left], [right]]);
    },
  );
});
