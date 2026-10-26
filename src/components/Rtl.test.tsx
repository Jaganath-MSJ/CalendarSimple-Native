import { fireEvent, screen } from "@testing-library/react-native";
import { I18nManager, ScrollView } from "react-native";
import { Calendar } from "./Calendar";
import { renderCalendar } from "../test-utils/renderCalendar";
import { OCT_2026_EVENTS } from "../core/test/fixtures";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

// The flip rule end to end (TDD §8.1).
afterEach(() => {
  I18nManager.isRTL = false;
});

it("Arabic locale mirrors the header row in an LTR app", async () => {
  await renderCalendar(<Calendar locale="ar" />);
  expect(screen.getByTestId("calendar-header")).toHaveStyle({
    flexDirection: "row-reverse",
  });
});

it("an LTR calendar inside an RTL app is mirrored back", async () => {
  I18nManager.isRTL = true;
  await renderCalendar(<Calendar locale="en" />);
  expect(screen.getByTestId("calendar-header")).toHaveStyle({
    flexDirection: "row-reverse",
  });
});

it("an RTL calendar inside an RTL app is not mirrored twice", async () => {
  I18nManager.isRTL = true;
  await renderCalendar(<Calendar locale="ar" />);
  expect(screen.getByTestId("calendar-header")).toHaveStyle({
    flexDirection: "row",
  });
});

it("an LTR calendar in an LTR app is not mirrored", async () => {
  await renderCalendar(<Calendar locale="en" />);
  expect(screen.getByTestId("calendar-header")).toHaveStyle({
    flexDirection: "row",
  });
});

describe.each([
  ["ar", false, "row-reverse"],
  ["en", false, "row"],
  ["en", true, "row-reverse"],
  ["ar", true, "row"],
] as const)(
  "rows follow the flip rule (%s, app RTL %s)",
  (locale, rtl, dir) => {
    beforeEach(() => {
      I18nManager.isRTL = rtl;
    });
    const flipped = dir === "row-reverse";

    it("schedule row and its event body", async () => {
      await renderCalendar(
        <Calendar
          view="schedule"
          locale={locale}
          selectedDate={new Date(2026, 9, 22)}
          events={OCT_2026_EVENTS}
        />,
      );
      expect(screen.getAllByTestId(/-schedule-section$/)[0]).toHaveStyle({
        flexDirection: dir,
      });
      expect(screen.getByTestId("calendar-o19-schedule-event")).toHaveStyle({
        flexDirection: dir,
      });
    });

    it("schedule title padding swaps only when flipped", async () => {
      await renderCalendar(
        <Calendar
          view="schedule"
          locale={locale}
          selectedDate={new Date(2026, 9, 22)}
          events={OCT_2026_EVENTS}
        />,
      );
      expect(screen.getAllByText("Stand-up")[0]).toHaveStyle(
        flipped ? { paddingStart: 12 } : { paddingEnd: 12 },
      );
    });

    it("day sheet rows", async () => {
      await renderCalendar(
        <Calendar
          locale={locale}
          selectedDate={new Date(2026, 9, 22)}
          events={OCT_2026_EVENTS}
        />,
      );
      await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
      expect(screen.getByTestId("calendar-o19-day-sheet-item")).toHaveStyle({
        flexDirection: dir,
      });
    });

    it("picker button label and caret", async () => {
      await renderCalendar(<Calendar locale={locale} />);
      expect(screen.getByTestId("calendar-header-view-select")).toHaveStyle({
        flexDirection: dir,
      });
    });
  },
);

describe("fixed-width time grid (swipe off) starts at the first day", () => {
  const week = (locale: string) =>
    renderCalendar(
      <Calendar
        view="week"
        locale={locale}
        swipeNavigation={false}
        selectedDate={new Date(2026, 9, 22)}
      />,
    );
  const contentReady = () =>
    fireEvent(
      screen.getByTestId("calendar-time-grid-hscroll"),
      "contentSizeChange",
      7 * 300,
      1000,
    );

  it("flipped (ar in an LTR app): grid, header and banner scroll to the end", async () => {
    const toEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
    await week("ar");
    toEnd.mockClear();
    await contentReady();
    expect(toEnd).toHaveBeenCalledTimes(3);
    expect(toEnd).toHaveBeenCalledWith({ animated: false });
    toEnd.mockRestore();
  });

  it("not flipped: stays at the start", async () => {
    const toEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
    await week("en");
    await contentReady();
    expect(toEnd).not.toHaveBeenCalled();
    toEnd.mockRestore();
  });
});

it("react-native-web (no I18nManager.isRTL) counts as an LTR app", async () => {
  const rn = I18nManager as { isRTL?: boolean };
  const saved = Object.getOwnPropertyDescriptor(rn, "isRTL");
  Object.defineProperty(rn, "isRTL", {
    value: undefined,
    configurable: true,
    writable: true,
  });
  try {
    await renderCalendar(<Calendar locale="en" />);
    expect(screen.getByTestId("calendar-header")).toHaveStyle({
      flexDirection: "row",
    });
  } finally {
    if (saved) Object.defineProperty(rn, "isRTL", saved);
  }
});
