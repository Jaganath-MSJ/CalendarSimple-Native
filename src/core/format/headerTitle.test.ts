import { describe, it, expect } from "vitest";
import { getHeaderTitle } from "./headerTitle";
import { getVisibleDays } from "../layout/visibleDays";
import { dateFn } from "../utils/date";
import type { ECalendarViewType } from "../types";

const t = (
  view: ECalendarViewType,
  iso: string,
  compact = false,
  extra = {},
) => {
  const d = dateFn(iso);
  const visibleDays =
    view === "week" || view === "day" || view === "customDays"
      ? getVisibleDays(view, d, {
          weekStartsOn: 0,
          weekEndsOn: 6,
          customDays: 3,
        })
      : [];
  return getHeaderTitle({
    view,
    selectedDate: d,
    visibleDays,
    locale: "en",
    showWeekNumbers: false,
    compact,
    ...extra,
  });
};

describe("getHeaderTitle", () => {
  it("month", () => expect(t("month", "2026-10-22")).toBe("October 2026"));
  it("day", () => expect(t("day", "2026-10-22")).toBe("October 22, 2026"));
  it("#4: week title follows the visible days", () =>
    expect(t("week", "2026-11-01")).toBe("November 2026"));
  it("week across months", () =>
    expect(t("week", "2026-10-01")).toBe("Sep - Oct 2026"));
  it("custom days, wide and compact", () => {
    expect(t("customDays", "2026-10-22")).toBe(
      "Thu, 22 Oct - Sat, 24 Oct, 2026",
    );
    expect(t("customDays", "2026-10-22", true)).toBe("22 - 24 Oct 2026");
  });
  it("schedule uses its window", () =>
    expect(
      t("schedule", "2026-10-22", false, {
        scheduleRange: {
          start: dateFn("2026-10-22"),
          end: dateFn("2026-11-20"),
        },
      }),
    ).toBe("Oct - Nov 2026"));
});
