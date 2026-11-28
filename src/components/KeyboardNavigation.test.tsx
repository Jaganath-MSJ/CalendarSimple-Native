import { Platform } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { DateTime } from "luxon";
import { Calendar } from "./Calendar";
import { OCT_2026_EVENTS } from "../core/test/fixtures";
import { renderCalendar } from "../test-utils/renderCalendar";
import { useFrozenClock } from "../test-utils/clock";

// eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
useFrozenClock("2026-11-16T09:30:00");

const oct22 = new Date(2026, 9, 22);
let os: typeof Platform.OS | undefined;

function asWeb() {
  os = Platform.OS;
  Object.defineProperty(Platform, "OS", {
    get: () => "web",
    configurable: true,
  });
}
afterEach(() => {
  const real = os;
  if (real)
    Object.defineProperty(Platform, "OS", {
      get: () => real,
      configurable: true,
    });
  os = undefined;
});

/** Fires a keydown on `testID`; returns the event's preventDefault mock. */
async function key(
  testID: string,
  k: string,
  extra: Record<string, unknown> = {},
) {
  const preventDefault = jest.fn();
  await fireEvent(screen.getByTestId(testID), "keyDown", {
    nativeEvent: { key: k, shiftKey: false, ...extra },
    preventDefault,
  });
  return preventDefault;
}
const monthKey = (k: string, extra?: Record<string, unknown>) =>
  key("calendar-month-view", k, extra);

const cells = () => screen.getAllByTestId(/^calendar-\d+-month-cell$/);
/** The accessibility label of the grid's tab stop, without the event count. */
const tabStop = () => {
  const stops = cells().filter((c) => c.props.tabIndex === 0);
  expect(stops).toHaveLength(1);
  return String(stops[0]!.props.accessibilityLabel)
    .split(",")
    .slice(0, 2)
    .join(",");
};
const title = () => screen.getByTestId("calendar-header-title");
const isoOf = (spy: jest.Mock<void, [Date]>) =>
  DateTime.fromJSDate(spy.mock.calls.at(-1)![0]).toISODate();

describe("month grid (web)", () => {
  beforeEach(asWeb);

  it("makes one cell the tab stop: the selected date", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} selectable />);
    expect(tabStop()).toBe("October 22, 2026");
    expect(cells().filter((c) => c.props.tabIndex === -1)).toHaveLength(
      cells().length - 1,
    );
  });

  it("arrow keys, Home and End move the tab stop", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} />);
    const prevent = await monthKey("ArrowRight");
    expect(prevent).toHaveBeenCalled();
    expect(tabStop()).toBe("October 23, 2026");
    await monthKey("ArrowUp");
    expect(tabStop()).toBe("October 16, 2026");
    await monthKey("Home");
    expect(tabStop()).toBe("October 11, 2026");
    await monthKey("End");
    expect(tabStop()).toBe("October 17, 2026");
    await monthKey("ArrowLeft");
    expect(tabStop()).toBe("October 16, 2026");
  });

  it("swaps ← and → in right-to-left", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} direction="rtl" />);
    await monthKey("ArrowLeft");
    expect(tabStop()).toBe("October 23, 2026");
  });

  it("leaving the month navigates and reports it", async () => {
    const onNavigate = jest.fn<void, [Date]>();
    await renderCalendar(
      <Calendar selectedDate={oct22} onNavigate={onNavigate} />,
    );
    await monthKey("ArrowDown");
    expect(onNavigate).not.toHaveBeenCalled();
    await monthKey("ArrowDown");
    expect(title()).toHaveTextContent("November 2026");
    expect(isoOf(onNavigate)).toBe("2026-11-05");
    expect(tabStop()).toBe("November 5, 2026");
  });

  it("PageDown, Shift+PageUp and T", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} />);
    await monthKey("PageDown");
    expect(title()).toHaveTextContent("November 2026");
    expect(tabStop()).toBe("November 22, 2026");
    await monthKey("PageUp", { shiftKey: true });
    expect(title()).toHaveTextContent("November 2025");
    await monthKey("t");
    expect(title()).toHaveTextContent("November 2026");
    expect(tabStop()).toBe("November 16, 2026");
  });

  it("focus by click or Tab moves the tab stop", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} />);
    await fireEvent(screen.getByTestId("calendar-9-month-cell"), "focus");
    expect(tabStop()).toBe("October 9, 2026");
  });

  it("skips hidden weekdays in a work week", async () => {
    await renderCalendar(
      <Calendar
        selectedDate={new Date(2026, 9, 23)}
        weekStartsOn={1}
        weekEndsOn={5}
      />,
    );
    await monthKey("ArrowRight");
    expect(tabStop()).toBe("October 26, 2026");
  });

  it("ignores keys typed in a field and browser shortcuts", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} />);
    const typed = await monthKey("ArrowRight", {
      target: { tagName: "INPUT" },
    });
    expect(typed).not.toHaveBeenCalled();
    const shortcut = await monthKey("ArrowRight", { metaKey: true });
    expect(shortcut).not.toHaveBeenCalled();
    expect(tabStop()).toBe("October 22, 2026");
  });

  it("keyboardNavigation={false} leaves the cells as they were", async () => {
    await renderCalendar(
      <Calendar selectedDate={oct22} keyboardNavigation={false} />,
    );
    expect(cells().every((c) => c.props.tabIndex === undefined)).toBe(true);
    expect(
      screen.getByTestId("calendar-month-view").props.onKeyDown,
    ).toBeUndefined();
  });
});

describe("time grids and schedule (web)", () => {
  beforeEach(asWeb);

  it("PageDown, ← and T turn the week", async () => {
    const onNavigate = jest.fn<void, [Date]>();
    await renderCalendar(
      <Calendar view="week" selectedDate={oct22} onNavigate={onNavigate} />,
    );
    await key("calendar-week-view", "PageDown");
    expect(isoOf(onNavigate)).toBe("2026-10-29");
    await key("calendar-week-view", "ArrowLeft");
    await key("calendar-week-view", "ArrowLeft");
    expect(isoOf(onNavigate)).toBe("2026-10-15");
    await key("calendar-week-view", "T");
    expect(isoOf(onNavigate)).toBe("2026-11-16");
    expect(title()).toHaveTextContent("November 2026");
  });

  it("→ means the previous day in right-to-left", async () => {
    const onNavigate = jest.fn<void, [Date]>();
    await renderCalendar(
      <Calendar
        view="day"
        selectedDate={oct22}
        direction="rtl"
        onNavigate={onNavigate}
      />,
    );
    await key("calendar-day-view", "ArrowRight");
    expect(isoOf(onNavigate)).toBe("2026-10-21");
  });

  it("↑ / ↓ move focus between Schedule rows", async () => {
    await renderCalendar(
      <Calendar
        view="schedule"
        selectedDate={oct22}
        events={OCT_2026_EVENTS}
      />,
    );
    const rows = [0, 1].map(() => ({
      focus: jest.fn(),
      scrollIntoView: jest.fn(),
    }));
    const list = screen.getByTestId("calendar-schedule-view").parent!;
    const preventDefault = jest.fn();
    await fireEvent(list, "keyDown", {
      nativeEvent: { key: "ArrowDown", target: rows[0] },
      currentTarget: { querySelectorAll: () => rows },
      preventDefault,
    });
    expect(rows[1]!.focus).toHaveBeenCalled();
    expect(rows[1]!.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    expect(preventDefault).toHaveBeenCalled();
    // At the last row nothing moves and the browser keeps the key.
    const atEnd = jest.fn();
    await fireEvent(list, "keyDown", {
      nativeEvent: { key: "ArrowDown", target: rows[1] },
      currentTarget: { querySelectorAll: () => rows },
      preventDefault: atEnd,
    });
    expect(atEnd).not.toHaveBeenCalled();
  });

  it("PageDown does nothing in Schedule (no Prev/Next since 1.1)", async () => {
    await renderCalendar(
      <Calendar
        view="schedule"
        selectedDate={oct22}
        events={OCT_2026_EVENTS}
      />,
    );
    const list = screen.getByTestId("calendar-schedule-view").parent!;
    const preventDefault = jest.fn();
    await fireEvent(list, "keyDown", {
      nativeEvent: { key: "PageDown" },
      preventDefault,
    });
    // The browser keeps the key (it scrolls the list).
    expect(preventDefault).not.toHaveBeenCalled();
    expect(screen.getAllByTestId(/-schedule-section$/)[0]!.props.testID).toBe(
      "calendar-2026-10-01-schedule-section",
    );
  });
});

describe("native", () => {
  it("adds no tab stops or key handling", async () => {
    await renderCalendar(<Calendar selectedDate={oct22} />);
    expect(cells().every((c) => c.props.tabIndex === undefined)).toBe(true);
    expect(
      screen.getByTestId("calendar-month-view").props.onKeyDown,
    ).toBeUndefined();
  });
});
