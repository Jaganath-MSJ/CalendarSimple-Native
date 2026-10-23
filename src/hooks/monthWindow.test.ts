import {
  buildMonthGrid,
  dateFn,
  layoutAllDayBanner,
  layoutDayEvents,
} from "../core";
import { inRange } from "./useDayEventLayout";
import { OCT_2026_EVENTS } from "../core/test/fixtures";
import { generateEvents } from "../../example/src/perf/generateEvents";
import { windowEvents } from "./monthWindow";

const garbage = [
  { id: "bad", title: "Bad", startDate: "not a date" },
  { id: "neg", title: "Neg", startDate: "2026-10-10", endDate: "2026-10-01" },
];
const opts = {
  minHour: 0,
  maxHour: 24,
  showAllDayRow: true,
  eventOverlapOffset: 10,
};
const sets = {
  fixtures: [...OCT_2026_EVENTS, ...garbage],
  generated: generateEvents(1000, 42, dateFn(new Date(2026, 9, 22))),
};

describe.each(Object.entries(sets))("%s", (_, events) => {
  it.each([
    [2026, 9, 0, 6],
    [2026, 10, 1, 0],
    [2026, 11, 0, 6],
    [2026, 7, 6, 5],
  ])("%i-%i (week %i–%i): same grid as the full list", (y, m, ws, we) => {
    const month = dateFn(new Date(y, m, 15));
    const full = buildMonthGrid(month, events, ws, we);
    const windowed = buildMonthGrid(month, windowEvents(events, month), ws, we);
    expect(windowed).toEqual(full);
  });

  it.each([
    ["2026-10-18", 7],
    ["2026-10-22", 1],
    ["2026-11-29", 3],
  ])("days from %s (%i): same time-grid and banner layout", (from, n) => {
    const days = Array.from({ length: n }, (_, i) =>
      dateFn(from).plus({ days: i }),
    );
    const subset = inRange(events, days);
    expect(layoutDayEvents(subset, days, opts)).toEqual(
      layoutDayEvents(events, days, opts),
    );
    for (const expanded of [false, true])
      expect(layoutAllDayBanner(days, subset, expanded, 3)).toEqual(
        layoutAllDayBanner(days, events, expanded, 3),
      );
  });
});

it("keeps unparseable events so the core can warn about them", () => {
  const kept = windowEvents(garbage, dateFn(new Date(2026, 0, 1)));
  expect(kept.map((e) => e.id)).toEqual(["bad", "neg"]);
});

it("drops events far outside the month", () => {
  const kept = windowEvents(
    [{ id: "far", title: "Far", startDate: "2027-06-01" }],
    dateFn(new Date(2026, 9, 1)),
  );
  expect(kept).toEqual([]);
});
