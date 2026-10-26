import { AccessibilityInfo, Animated, Text, View } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { CalendarProvider } from "../../context/CalendarContext";
import { PageProvider } from "../../context/LayoutContext";
import { dateFn } from "../../core";
import { MonthSkeleton } from "./Skeletons";
import { Calendar } from "../Calendar";
import type { ECalendarViewType } from "../../core";
import type { CalendarProps } from "../../types";
import { renderCalendar } from "../../test-utils/renderCalendar";

const reduceMotion = (on: boolean) =>
  jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(on);

const loading = (view: ECalendarViewType, props: Partial<CalendarProps> = {}) =>
  renderCalendar(<Calendar view={view} isLoading events={[]} {...props} />);

beforeEach(() => reduceMotion(false));
afterEach(() => jest.restoreAllMocks());

it("month skeleton keeps the header", async () => {
  await loading("month");
  expect(screen.getByTestId("month-skeleton")).toBeOnTheScreen();
  expect(screen.getByTestId("month-skeleton")).toHaveProp(
    "accessibilityLabel",
    "Loading events",
  );
  expect(screen.getByTestId("calendar-header")).toBeOnTheScreen();
});

it("time-grid skeleton shape", async () => {
  await loading("week");
  expect(screen.getByTestId("time-grid-skeleton")).toBeOnTheScreen();
  expect(screen.getAllByTestId("time-slot")).toHaveLength(8);
  expect(screen.getAllByTestId("event-bar")).toHaveLength(3);
  expect(screen.getAllByTestId("event-bar")[1]).toHaveStyle({
    top: "38%",
    left: "52%",
    width: "30%",
    height: 40,
  });
});

it("schedule skeleton shape", async () => {
  await loading("schedule");
  expect(screen.getAllByTestId("schedule-skeleton-row")).toHaveLength(4);
  expect(screen.getAllByTestId("skeleton-circle")).toHaveLength(4);
  expect(screen.getAllByTestId("skeleton-line")).toHaveLength(8);
});

it("renderLoading replaces the skeleton", async () => {
  await loading("month", { renderLoading: () => <Text>Fetching…</Text> });
  // Pager neighbours mount after interactions and show it too.
  expect(screen.getAllByText("Fetching…")[0]).toBeOnTheScreen();
  expect(screen.queryByTestId("month-skeleton")).toBeNull();
});

it("pulses when Reduce Motion is off", async () => {
  const loop = jest.spyOn(Animated, "loop");
  await loading("month");
  await act(async () => {});
  expect(loop).toHaveBeenCalled();
});

it("no pulse under Reduce Motion", async () => {
  reduceMotion(true);
  const loop = jest.spyOn(Animated, "loop");
  await loading("month");
  await act(async () => {});
  expect(loop).not.toHaveBeenCalled();
});

it("month skeleton uses the §4.7 header and row heights", async () => {
  await loading("month");
  const grid = screen.getByTestId("month-skeleton");
  const rows = grid.children as unknown as { props: { style: unknown } }[];
  expect(rows[0]).toHaveStyle({ height: 40 });
  expect(rows[1]).toHaveStyle({ height: 100 });
});

it("neighbour-page skeletons are hidden, unlabelled and static", async () => {
  const loop = jest.spyOn(Animated, "loop");
  await render(
    <CalendarProvider
      initialDate={dateFn(new Date(2026, 9, 22))}
      initialView="month"
    >
      <PageProvider value={false}>
        <View testID="wrap">
          <MonthSkeleton />
        </View>
      </PageProvider>
    </CalendarProvider>,
  );
  await act(async () => {});
  expect(screen.queryByTestId("month-skeleton")).toBeNull();
  expect(screen.queryByLabelText("Loading events")).toBeNull();
  expect(loop).not.toHaveBeenCalled();
  const root = screen.getByTestId("wrap").children[0] as unknown as {
    props: Record<string, unknown>;
  };
  expect(root.props).toMatchObject({
    accessible: false,
    importantForAccessibility: "no-hide-descendants",
    accessibilityElementsHidden: true,
  });
  expect(root.props.accessibilityState).toBeUndefined();
});
