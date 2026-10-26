import { fireEvent, screen } from "@testing-library/react-native";
import { PixelRatio } from "react-native";
import { Calendar } from "../Calendar";
import { OCT_2026_EVENTS } from "../../core/test/fixtures";
import { renderCalendar } from "../../test-utils/renderCalendar";
import { useFrozenClock } from "../../test-utils/clock";
import type { CalendarProps } from "../../types";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock();

afterEach(() => jest.restoreAllMocks());

const expectAllCapped = (cap: number) => {
  // RNTL 14 has no UNSAFE_getAllByType; host <Text> nodes stand in for it.
  const texts = screen.container.queryAll((n) => n.type === "Text");
  expect(texts.length).toBeGreaterThan(0);
  texts.forEach((t) => expect(t.props.maxFontSizeMultiplier).toBe(cap));
};

it.each(["month", "week", "day", "customDays", "schedule"] as const)(
  "%s: caps text scaling at maxFontSizeMultiplier",
  async (view: CalendarProps["view"]) => {
    await renderCalendar(
      <Calendar
        view={view}
        selectedDate={new Date(2026, 9, 22)}
        events={OCT_2026_EVENTS}
        maxFontSizeMultiplier={1.3}
      />,
    );
    expectAllCapped(1.3);
  },
);

it("caps text in the view picker and the day sheet", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      events={OCT_2026_EVENTS}
      maxFontSizeMultiplier={1.3}
    />,
  );
  await fireEvent.press(screen.getByTestId("calendar-22-month-cell"));
  expectAllCapped(1.3);
});

it("caps text in the wide header and pickers", async () => {
  await renderCalendar(
    <Calendar
      selectedDate={new Date(2026, 9, 22)}
      maxFontSizeMultiplier={1.3}
    />,
    { width: 1194, height: 834 },
  );
  await fireEvent.press(screen.getByTestId("calendar-header-view-select"));
  expectAllCapped(1.3);
});

it("metrics follow the system font scale up to the cap", async () => {
  jest.spyOn(PixelRatio, "getFontScale").mockReturnValue(2);
  await renderCalendar(<Calendar selectedDate={new Date(2026, 9, 22)} />, {
    width: 1194,
    height: 834,
  });
  expect(screen.getByTestId("calendar-22-month-label")).toHaveStyle({
    fontSize: 19.5,
  }); // 13 × 1.5
});
