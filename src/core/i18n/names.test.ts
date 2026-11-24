import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTime, Info } from "luxon";
import {
  clearNameCache,
  formatMonthYear,
  monthNames,
  nameSource,
  registerLocaleNames,
  weekdayNames,
} from "./names";
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
  registerLocaleNames("fr", undefined);
  registerLocaleNames("fr-CA", undefined);
  clearNameCache();
});

const FR = {
  months: [
    "janv-L",
    "févr-L",
    "mars-L",
    "avr-L",
    "mai-L",
    "juin-L",
    "juil-L",
    "août-L",
    "sept-L",
    "oct-L",
    "nov-L",
    "déc-L",
  ],
  monthsShort: ["j", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"],
  weekdays: ["dim-L", "lun-L", "mar-L", "mer-L", "jeu-L", "ven-L", "sam-L"],
  weekdaysShort: ["di", "lu", "ma", "me", "je", "ve", "sa"],
};

describe("registerLocaleNames", () => {
  it("wins over Luxon, Intl and English", () => {
    registerLocaleNames("fr", FR);
    expect(monthNames("long", "fr")[9]).toBe("oct-L");
    expect(monthNames("short", "fr")[9]).toBe("o");
    emptyLuxonNames();
    emptyIntlNames();
    clearNameCache();
    expect(monthNames("long", "fr")[0]).toBe("janv-L");
  });

  it("takes weekdays Sunday first and returns them Monday first", () => {
    registerLocaleNames("fr", FR);
    expect(weekdayNames("long", "fr")[0]).toBe("lun-L");
    expect(weekdayNames("short", "fr")[6]).toBe("di");
    expect(getDayListNames(EDayType.half, "fr")[0]).toBe("di");
  });

  it("applies the language names to a region, and a region's own first", () => {
    registerLocaleNames("fr", FR);
    expect(monthNames("long", "fr-CA")[0]).toBe("janv-L");
    registerLocaleNames("fr-CA", {
      ...FR,
      months: FR.months.map((m) => `${m}!`),
    });
    expect(monthNames("long", "fr-CA")[0]).toBe("janv-L!");
    expect(monthNames("long", "fr")[0]).toBe("janv-L");
  });

  it("fills formatDate tokens even when Luxon has names", () => {
    registerLocaleNames("fr", FR);
    const d = DateTime.fromISO("2026-10-22T09:30:00");
    expect(formatDate(d, "EEEE d MMMM yyyy", "fr")).toBe("jeu-L 22 oct-L 2026");
  });

  it("ignores an incomplete list", () => {
    registerLocaleNames("fr", { months: ["only one"] });
    expect(monthNames("long", "fr")[0]).toBe("janvier");
  });

  it("removes the names with undefined", () => {
    registerLocaleNames("fr", FR);
    registerLocaleNames("fr", undefined);
    expect(monthNames("long", "fr")[0]).toBe("janvier");
  });
});

describe("nameSource", () => {
  it("reports each tier", () => {
    expect(nameSource("month", "long", "fr")).toBe("luxon");
    emptyLuxonNames();
    expect(nameSource("month", "long", "fr")).toBe("intl");
    emptyIntlNames();
    expect(nameSource("weekday", "short", "ja")).toBe("english");
    registerLocaleNames("fr", FR);
    expect(nameSource("month", "long", "fr")).toBe("custom");
  });
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

  it("formatMonthYear: Intl order; registered names keep the pattern", () => {
    const d = DateTime.fromISO("2026-03-05");
    expect(formatMonthYear(d, "ja-JP")).toBe("2026年3月");
    expect(formatMonthYear(d, "en", "short")).toBe("Mar 2026");
    registerLocaleNames("fr", FR);
    expect(formatMonthYear(d, "fr")).toBe("mars-L 2026");
    // No month names from Intl: the MMMM yyyy fallback.
    registerLocaleNames("fr", undefined);
    emptyLuxonNames();
    emptyIntlNames();
    expect(formatMonthYear(d, "fr")).toBe("March 2026");
  });

  it("leaves formats without names untouched", () => {
    emptyLuxonNames();
    const d = DateTime.fromISO("2026-10-22T09:30:00");
    expect(formatDate(d, "yyyy-MM-dd HH:mm", "fr")).toBe("2026-10-22 09:30");
  });
});
