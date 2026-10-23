import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTime, Info } from "luxon";
import { clearNameCache, monthNames, weekdayNames } from "./names";
import { formatDate } from "../utils/date";
import { getDayListNames, getMonthList } from "../utils/formatting";
import { buildLabelCache } from "../format/labels";
import { getHeaderTitle } from "../format/headerTitle";
import { ECalendarViewType, EDayType } from "../types";

const RealDTF = Intl.DateTimeFormat;

/** Makes Luxon return empty names for every locale but English (iOS Hermes). */
function emptyLuxonNames(): void {
  for (const fn of [
    "months",
    "monthsFormat",
    "weekdays",
    "weekdaysFormat",
  ] as const) {
    const original = Info[fn].bind(Info);
    vi.spyOn(Info, fn).mockImplementation(((
      length: never,
      opts?: { locale?: string },
    ) => {
      const real = original(length, opts);
      return opts?.locale?.startsWith("en") ? real : real.map(() => "");
    }) as never);
  }
}

/** Makes `Intl.DateTimeFormat` return empty month / weekday names too. */
function emptyIntlNames(): void {
  vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
    locale: string,
    options?: Intl.DateTimeFormatOptions,
  ) {
    const real = new RealDTF(locale, options);
    if (!options || (!options.month && !options.weekday)) return real;
    return {
      format: () => "",
      formatToParts: (d: Date) =>
        real
          .formatToParts(d)
          .map((p) =>
            p.type === "month" || p.type === "weekday"
              ? { ...p, value: "" }
              : p,
          ),
      resolvedOptions: () => real.resolvedOptions(),
    };
  } as never);
}

afterEach(() => {
  vi.restoreAllMocks();
  clearNameCache();
});

describe("name fallbacks", () => {
  it("uses Luxon names when they are present", () => {
    expect(monthNames("long", "fr")[0]).toBe("janvier");
    expect(weekdayNames("short", "ja")).toHaveLength(7);
  });

  it("falls back to Intl formatToParts when Luxon names are empty", () => {
    emptyLuxonNames();
    expect(monthNames("long", "fr")[0]).toBe("janvier");
    expect(weekdayNames("short", "ja")[0]).toBe("月");
    expect(weekdayNames("long", "fr")[6]).toBe("dimanche");
  });

  it("falls back to English when Luxon and Intl are both empty", () => {
    emptyLuxonNames();
    emptyIntlNames();
    expect(monthNames("long", "fr")[0]).toBe("January");
    expect(weekdayNames("short", "ja")[0]).toBe("Mon");
  });

  it("routes getMonthList, getDayListNames and buildLabelCache", () => {
    emptyLuxonNames();
    emptyIntlNames();
    expect(getMonthList("fr")[0]!.label).toBe("January");
    expect(getDayListNames(EDayType.half, "ja")[0]).toBe("Sun");
    const labels = buildLabelCache("ja-JP-fallback", false, EDayType.full);
    expect(labels.weekdayNames[1]).toBe("Monday");
    expect(labels.monthNames[11]).toBe("December");
  });

  it("formatDate substitutes month and weekday tokens", () => {
    const d = DateTime.fromISO("2026-10-22T09:30:00");
    emptyLuxonNames();
    expect(formatDate(d, "MMMM d, yyyy", "fr")).toBe("octobre 22, 2026");
    expect(formatDate(d, "EEE, d MMM", "ja")).toBe("木, 22 10月");
    emptyIntlNames();
    clearNameCache();
    expect(formatDate(d, "MMMM yyyy", "fr")).toBe("October 2026");
    expect(formatDate(d, "EEE, d MMM", "ja")).toBe("Thu, 22 Oct");
    expect(formatDate(d, "'Le' d MMMM", "fr")).toBe("Le 22 October");
  });

  it("getHeaderTitle uses the fallback", () => {
    emptyLuxonNames();
    emptyIntlNames();
    const d = DateTime.fromISO("2026-10-22");
    expect(
      getHeaderTitle({
        view: ECalendarViewType.month,
        selectedDate: d,
        visibleDays: [],
        locale: "fr",
        showWeekNumbers: false,
        compact: false,
      }),
    ).toBe("October 2026");
  });

  it("leaves formats without names untouched", () => {
    emptyLuxonNames();
    const d = DateTime.fromISO("2026-10-22T09:30:00");
    expect(formatDate(d, "yyyy-MM-dd HH:mm", "fr")).toBe("2026-10-22 09:30");
  });
});
