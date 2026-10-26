/**
 * @file Month and weekday names with fallbacks.
 *
 * iOS Hermes returns empty strings from Luxon's `Info.months` /
 * `Info.weekdays` (and the matching `toFormat` tokens) for some locales such
 * as `fr` and `ja`. Every displayed name goes through this module:
 *
 * 1. Luxon's names for the locale, when every entry is non-empty.
 * 2. `Intl.DateTimeFormat(locale, { month | weekday }).formatToParts`
 *    (then `.format`) on fixed reference dates (standalone forms).
 * 3. Luxon's English names.
 */
import { DateTime, Info } from "luxon";

/** Name width: `"long"` (janvier) or `"short"` (janv.). */
export type NameLength = "long" | "short";

/** `"format"` names sit inside a date (MMMM); `"standalone"` stand alone (LLLL). */
export type NameContext = "format" | "standalone";

const cache = new Map<string, string[]>();
const luxonOk = new Map<string, boolean>();

/** Clears the name caches (tests). */
export function clearNameCache(): void {
  cache.clear();
  luxonOk.clear();
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

  let names = luxon(loc);
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

/** True when Luxon's own names for `locale` are complete (fast path). */
function luxonNamesUsable(locale: string): boolean {
  const hit = luxonOk.get(locale);
  if (hit !== undefined) return hit;
  const ok =
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
