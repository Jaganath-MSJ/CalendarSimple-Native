import { DateTime, Info } from "luxon";

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
};

export function probeMonthsLong(locale: string): string[] {
  try {
    return Info.months("long", { locale });
  } catch {
    return [];
  }
}

export function probeWeekdaysShort(locale: string): string[] {
  try {
    return Info.weekdays("short", { locale });
  } catch {
    return [];
  }
}

export function probeMeridiem(locale: string): string {
  try {
    return DateTime.fromObject({ hour: 13 }).setLocale(locale).toFormat("a");
  } catch {
    return "";
  }
}

export function probeDigits(locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { useGrouping: false }).format(123);
  } catch {
    return "";
  }
}

/** 0 = Sunday ... 6 = Saturday; null when the engine exposes no week info. */
export function probeWeekStart(locale: string): number | null {
  try {
    const loc = new Intl.Locale(locale) as WeekInfoLocale;
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    return info ? info.firstDay % 7 : null;
  } catch {
    return null;
  }
}

export function probeHourCycle(locale: string): string | null {
  try {
    return (
      new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions()
        .hourCycle ?? null
    );
  } catch {
    return null;
  }
}
