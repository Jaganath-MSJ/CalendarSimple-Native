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
  it("week number: the ISO week of the week's Thursday, via messages", () => {
    // Sun 27 Sep – Sat 3 Oct 2026: Sunday is in ISO week 39, Thursday in 40.
    expect(t("week", "2026-09-27", false, { showWeekNumbers: true })).toBe(
      "Sep - Oct 2026  ·  W40",
    );
    expect(
      t("week", "2026-10-22", false, {
        showWeekNumbers: true,
        weekNumber: (n: number) => `KW ${n}`,
      }),
    ).toBe("October 2026  ·  KW 43");
    // Only Week gets the suffix; Month keeps it in its column.
    expect(t("day", "2026-10-22", false, { showWeekNumbers: true })).toBe(
      "October 22, 2026",
    );
    // Year boundary: Sun 27 Dec 2026's week has Thu 31 Dec, ISO week 53.
    expect(t("week", "2026-12-27", false, { showWeekNumbers: true })).toBe(
      "Dec 2026 - Jan 2027  ·  W53",
    );
  });
  it("month and year in the locale's order (Intl)", () => {
    const m = (locale: string) => t("month", "2026-10-22", false, { locale });
    expect([m("en"), m("ja-JP"), m("zh-CN"), m("ko-KR"), m("fr")]).toEqual([
      "October 2026",
      "2026年10月",
      "2026年10月",
      "2026년 10월",
      "octobre 2026",
    ]);
    expect(t("week", "2026-12-27", false, { locale: "ja-JP" })).toBe(
      "2026年12月 - 2027年1月",
    );
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
