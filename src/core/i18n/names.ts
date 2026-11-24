/**
 * @file Month and weekday names with fallbacks.
 *
 * iOS Hermes returns empty strings from Luxon's `Info.months` /
 * `Info.weekdays` (and the matching `toFormat` tokens) for some locales such
 * as `fr` and `ja`. Every displayed name goes through this module:
 *
 * 1. Names registered with `registerLocaleNames` for the locale (or its
 *    language: `fr-CA` uses `fr`).
 * 2. Luxon's names for the locale, when every entry is non-empty.
 * 3. `Intl.DateTimeFormat(locale, { month | weekday }).formatToParts`
 *    (then `.format`) on fixed reference dates (standalone forms).
 * 4. Luxon's English names.
 */
import { DateTime, Info } from "luxon";

/** Name width: `"long"` (janvier) or `"short"` (janv.). */
export type NameLength = "long" | "short";

/** `"format"` names sit inside a date (MMMM); `"standalone"` stand alone (LLLL). */
export type NameContext = "format" | "standalone";

/**
 * Month and weekday names for one locale, used before any built-in source.
 * Each list is optional; a missing or incomplete list falls back as usual.
 */
export interface LocaleNames {
  /** Twelve long month names, January first. */
  months?: string[];
  /** Twelve short month names, January first. */
  monthsShort?: string[];
  /** Seven long weekday names, **Sunday first** (like `weekStartsOn` 0). */
  weekdays?: string[];
  /** Seven short weekday names, Sunday first. */
  weekdaysShort?: string[];
}

/** Where a locale's names come from (IntlCheck screen, tests). */
export type NameSource = "custom" | "luxon" | "intl" | "english";

const cache = new Map<string, string[]>();
const luxonOk = new Map<string, boolean>();
const custom = new Map<string, LocaleNames>();
const monthYearFormats = new Map<string, Intl.DateTimeFormat | null>();

/** Clears the name caches (tests). */
export function clearNameCache(): void {
  cache.clear();
  luxonOk.clear();
  monthYearFormats.clear();
}

/**
 * Sets the month and weekday names for `locale` (for example `"fr"`, or
 * `"fr-CA"` for that region only). Call it once at app start, before the
 * calendar renders; a later call does not re-render a mounted calendar.
 * Pass `undefined` to remove the names.
 */
export function registerLocaleNames(
  locale: string,
  names: LocaleNames | undefined,
): void {
  if (names) custom.set(locale, names);
  else custom.delete(locale);
  clearNameCache();
}

/** The registered list for `locale` (or its language), Luxon order. */
function customNames(
  kind: "month" | "weekday",
  length: NameLength,
  locale: string,
): string[] | undefined {
  const names = custom.get(locale) ?? custom.get(locale.split("-")[0] ?? "");
  if (!names) return undefined;
  if (kind === "month") {
    const list = length === "long" ? names.months : names.monthsShort;
    return usable(list, 12) ? list : undefined;
  }
  const list = length === "long" ? names.weekdays : names.weekdaysShort;
  // Sunday first → Luxon's Monday first.
  return usable(list, 7) ? [...list.slice(1), list[0]!] : undefined;
}

function usable(names: unknown, count: number): names is string[] {
  return (
    Array.isArray(names) &&
    names.length === count &&
    names.every((n) => typeof n === "string" && n.trim() !== "")
  );
}

function safe(fn: () => string[]): string[] | undefined {
  try {
    return fn();
  } catch {
    return undefined;
  }
}

/** Reads one part (`month` / `weekday`) for each date through `Intl`. */
function intlNames(
  locale: string,
  part: "month" | "weekday",
  length: NameLength,
  dates: Date[],
): string[] | undefined {
  const options: Intl.DateTimeFormatOptions = {
    [part]: length,
    timeZone: "UTC",
  };
  const fromParts = safe(() => {
    const dtf = new Intl.DateTimeFormat(locale, options);
    // Only `part` was requested, so the joined parts are the whole name
    // (ja "10" + literal "月"); an empty `part` means the name is missing.
    return dates.map((d) => {
      const parts = dtf.formatToParts(d);
      const named = parts.find((p) => p.type === part)?.value ?? "";
      return named.trim() ? parts.map((p) => p.value).join("") : "";
    });
  });
  if (usable(fromParts, dates.length)) return fromParts;
  const fromFormat = safe(() => {
    const dtf = new Intl.DateTimeFormat(locale, options);
    return dates.map((d) => dtf.format(d));
  });
  return usable(fromFormat, dates.length) ? fromFormat : undefined;
}

const MONTH_DATES = Array.from(
  { length: 12 },
  (_, i) => new Date(Date.UTC(2000, i, 15, 12)),
);
// 3 Jan 2000 is a Monday: Luxon order (Mon … Sun).
const WEEKDAY_DATES = Array.from(
  { length: 7 },
  (_, i) => new Date(Date.UTC(2000, 0, 3 + i, 12)),
);

function resolve(
  kind: "month" | "weekday",
  length: NameLength,
  locale: string,
  context: NameContext,
): string[] {
  const loc = locale || "en";
  const key = `${kind}|${length}|${context}|${loc}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const count = kind === "month" ? 12 : 7;
  const luxon = (l: string) =>
    safe(() =>
      kind === "month"
        ? context === "format"
          ? Info.monthsFormat(length, { locale: l })
          : Info.months(length, { locale: l })
        : context === "format"
          ? Info.weekdaysFormat(length, { locale: l })
          : Info.weekdays(length, { locale: l }),
    );

  let names = customNames(kind, length, loc) ?? luxon(loc);
  if (!usable(names, count)) {
    // Intl names are standalone forms ({ month } alone): a "format" month
    // read from { month, day } parts loses its suffix in ja ("10" not "10月").
    names = intlNames(
      loc,
      kind,
      length,
      kind === "month" ? MONTH_DATES : WEEKDAY_DATES,
    );
  }
  if (!usable(names, count)) names = luxon("en");
  const result = names ?? [];
  cache.set(key, result);
  return result;
}

/** Twelve month names, January first. */
export function monthNames(
  length: NameLength,
  locale: string,
  context: NameContext = "standalone",
): string[] {
  return resolve("month", length, locale, context);
}

/** Seven weekday names, Monday first (Luxon order). */
export function weekdayNames(
  length: NameLength,
  locale: string,
  context: NameContext = "standalone",
): string[] {
  return resolve("weekday", length, locale, context);
}

/**
 * True when Luxon's own names for `locale` are complete and none are
 * registered (fast path: plain `toFormat`).
 */
function luxonNamesUsable(locale: string): boolean {
  const hit = luxonOk.get(locale);
  if (hit !== undefined) return hit;
  const ok =
    !custom.has(locale) &&
    !custom.has(locale.split("-")[0] ?? "") &&
    usable(
      safe(() => Info.monthsFormat("long", { locale })),
      12,
    ) &&
    usable(
      safe(() => Info.monthsFormat("short", { locale })),
      12,
    ) &&
    usable(
      safe(() => Info.weekdaysFormat("long", { locale })),
      7,
    ) &&
    usable(
      safe(() => Info.weekdaysFormat("short", { locale })),
      7,
    );
  luxonOk.set(locale, ok);
  return ok;
}

/** Which source `monthNames` / `weekdayNames` use for `locale`. */
export function nameSource(
  kind: "month" | "weekday",
  length: NameLength,
  locale: string,
): NameSource {
  const loc = locale || "en";
  if (customNames(kind, length, loc)) return "custom";
  const count = kind === "month" ? 12 : 7;
  const luxon = safe(() =>
    kind === "month"
      ? Info.months(length, { locale: loc })
      : Info.weekdays(length, { locale: loc }),
  );
  if (usable(luxon, count)) return "luxon";
  const intl = intlNames(
    loc,
    kind,
    length,
    kind === "month" ? MONTH_DATES : WEEKDAY_DATES,
  );
  return usable(intl, count) ? "intl" : "english";
}

const NAME_TOKEN = /M{3,4}|L{3,4}|E{3,4}|c{3,4}/;
const hasNames = new Map<string, boolean>();

/**
 * `DateTime#toFormat` with month and weekday tokens (`MMM`, `MMMM`, `LLL`,
 * `LLLL`, `EEE`, `EEEE`, `ccc`, `cccc`) filled from `monthNames` /
 * `weekdayNames` when Luxon's names for the locale are empty.
 */
export function formatWithNames(
  dt: DateTime,
  format: string,
  locale: string,
): string {
  let named = hasNames.get(format);
  if (named === undefined) {
    named = NAME_TOKEN.test(format.replace(/'[^']*'/g, ""));
    hasNames.set(format, named);
  }
  const localised = dt.setLocale(locale);
  if (!named || luxonNamesUsable(locale)) return localised.toFormat(format);

  let out = "";
  let pending = "";
  const flush = () => {
    if (pending) out += localised.toFormat(pending);
    pending = "";
  };
  let i = 0;
  while (i < format.length) {
    const ch = format[i]!;
    if (ch === "'") {
      const end = format.indexOf("'", i + 1);
      const stop = end === -1 ? format.length : end + 1;
      pending += format.slice(i, stop);
      i = stop;
      continue;
    }
    let run = 1;
    while (format[i + run] === ch) run++;
    const length: NameLength = run === 4 ? "long" : "short";
    if ((run === 3 || run === 4) && "MLEc".includes(ch)) {
      flush();
      const context: NameContext =
        ch === "M" || ch === "E" ? "format" : "standalone";
      out +=
        ch === "M" || ch === "L"
          ? monthNames(length, locale, context)[dt.month - 1]
          : weekdayNames(length, locale, context)[dt.weekday - 1];
    } else {
      pending += format.slice(i, i + run);
    }
    i += run;
  }
  flush();
  return out;
}

function monthYearFormat(
  locale: string,
  length: NameLength,
): Intl.DateTimeFormat | null {
  const key = `${locale}|${length}`;
  let dtf = monthYearFormats.get(key);
  if (dtf === undefined) {
    try {
      dtf = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: length,
        timeZone: "UTC",
      });
    } catch {
      dtf = null;
    }
    monthYearFormats.set(key, dtf);
  }
  return dtf;
}

/**
 * Month and year in the locale's own order: "October 2026", "2026年10月"
 * (ja, zh), "2026년 10월" (ko). Uses `Intl.DateTimeFormat` with `{ year,
 * month }`; falls back to `MMMM yyyy` / `MMM yyyy` (with the usual name
 * fallbacks) when `Intl` is missing or gives no month name, or when the app
 * registered its own month names for the locale.
 */
export function formatMonthYear(
  dt: DateTime,
  locale: string,
  length: NameLength = "long",
): string {
  const loc = locale || "en";
  const pattern = length === "long" ? "MMMM yyyy" : "MMM yyyy";
  const registered = custom.has(loc) || custom.has(loc.split("-")[0] ?? "");
  const dtf = registered ? null : monthYearFormat(loc, length);
  if (dtf) {
    try {
      // Mid-month at noon UTC: the same month in every time zone.
      const parts = dtf.formatToParts(
        new Date(Date.UTC(dt.year, dt.month - 1, 15, 12)),
      );
      const month = parts.find((p) => p.type === "month")?.value ?? "";
      // An empty month part means this engine has no names for the locale.
      if (month.trim()) return parts.map((p) => p.value).join("");
    } catch {
      // Fall through to the pattern.
    }
  }
  return formatWithNames(dt, pattern, loc);
}
