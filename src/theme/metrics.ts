/**
 * @file Size metrics by breakpoint (TDD §10.2).
 */
import { Platform } from "react-native";

export type Breakpoint = "phone" | "compact" | "wide";

export interface CalendarMetrics {
  header: {
    padding: number;
    titleFontSize: number;
    controlHeight: number;
    rows: 1 | 2;
    /** Fallback header height until the header is measured. */
    height: number;
  };
  month: {
    headerRowHeight: number;
    headerFontSize: number;
    labelSize: number;
    labelFontSize: number;
    chipHeight: number;
    chipFontSize: number;
    barHeight: number;
    barPitch: number;
    moreFontSize: number;
    weekNumberWidth: number;
  };
  timeGrid: {
    gutter: number;
    hourHeight: number;
    dayNameFontSize: number;
    dayNumberFontSize: number;
    customCircle: number;
    eventFontSize: number;
    smallEventHeight: number;
    tinyEventHeight: number;
  };
  banner: {
    chipHeight: number;
    rowHeight: number;
    fontSize: number;
    gmtFontSize: number;
    minHeight: number;
  };
  schedule: {
    dateWidth: number;
    circle: number;
    numberFontSize: number;
    timeWidth: number;
    timeFontSize: number;
    titleFontSize: number;
  };
  sheet: {
    radius: number;
    rowHeight: number;
    grabberWidth: number;
    grabberHeight: number;
  };
  /** Minimum touch target: 44 pt iOS, 48 dp Android. */
  touchTarget: number;
}

/** Breakpoint for a container width: ≤ 480 phone, ≤ 768 compact, else wide. */
export function getBreakpoint(width: number): Breakpoint {
  if (width <= 480) return "phone";
  if (width <= 768) return "compact";
  return "wide";
}

const PHONE_HEADER = {
  padding: 12,
  titleFontSize: 16,
  controlHeight: 36,
  rows: 2,
  height: 113,
} as const;

const BASE: Record<Breakpoint, Omit<CalendarMetrics, "touchTarget">> = {
  phone: {
    header: PHONE_HEADER,
    month: {
      headerRowHeight: 30,
      headerFontSize: 12,
      labelSize: 18,
      labelFontSize: 11,
      chipHeight: 20,
      chipFontSize: 11,
      barHeight: 6,
      barPitch: 8,
      moreFontSize: 10,
      weekNumberWidth: 36,
    },
    timeGrid: {
      gutter: 60,
      hourHeight: 60,
      dayNameFontSize: 10,
      dayNumberFontSize: 15,
      customCircle: 26,
      eventFontSize: 11,
      smallEventHeight: 40,
      tinyEventHeight: 20,
    },
    banner: {
      chipHeight: 20,
      rowHeight: 24,
      fontSize: 11,
      gmtFontSize: 10,
      minHeight: 28,
    },
    schedule: {
      dateWidth: 70,
      circle: 24,
      numberFontSize: 13,
      timeWidth: 100,
      timeFontSize: 11,
      titleFontSize: 13,
    },
    sheet: { radius: 16, rowHeight: 52, grabberWidth: 36, grabberHeight: 4 },
  },
  compact: {
    header: PHONE_HEADER,
    month: {
      headerRowHeight: 30,
      headerFontSize: 12,
      labelSize: 20,
      labelFontSize: 11,
      chipHeight: 20,
      chipFontSize: 11,
      barHeight: 6,
      barPitch: 8,
      moreFontSize: 11,
      weekNumberWidth: 36,
    },
    timeGrid: {
      gutter: 60,
      hourHeight: 60,
      dayNameFontSize: 10,
      dayNumberFontSize: 15,
      customCircle: 26,
      eventFontSize: 11,
      smallEventHeight: 40,
      tinyEventHeight: 20,
    },
    banner: {
      chipHeight: 20,
      rowHeight: 24,
      fontSize: 11,
      gmtFontSize: 10,
      minHeight: 28,
    },
    schedule: {
      dateWidth: 70,
      circle: 28,
      numberFontSize: 13,
      timeWidth: 140,
      timeFontSize: 13,
      titleFontSize: 14,
    },
    sheet: { radius: 16, rowHeight: 52, grabberWidth: 36, grabberHeight: 4 },
  },
  wide: {
    header: {
      padding: 16,
      titleFontSize: 20,
      controlHeight: 36,
      rows: 1,
      height: 69,
    },
    month: {
      headerRowHeight: 40,
      headerFontSize: 14,
      labelSize: 24,
      labelFontSize: 13,
      chipHeight: 24,
      chipFontSize: 12,
      barHeight: 6,
      barPitch: 8,
      moreFontSize: 12,
      weekNumberWidth: 36,
    },
    timeGrid: {
      gutter: 60,
      hourHeight: 60,
      dayNameFontSize: 12,
      dayNumberFontSize: 20,
      customCircle: 32,
      eventFontSize: 12,
      smallEventHeight: 40,
      tinyEventHeight: 20,
    },
    banner: {
      chipHeight: 20,
      rowHeight: 24,
      fontSize: 11,
      gmtFontSize: 10,
      minHeight: 28,
    },
    schedule: {
      dateWidth: 70,
      circle: 28,
      numberFontSize: 13,
      timeWidth: 140,
      timeFontSize: 13,
      titleFontSize: 14,
    },
    sheet: { radius: 16, rowHeight: 52, grabberWidth: 36, grabberHeight: 4 },
  },
};

/**
 * Metrics for a breakpoint. Text sizes and the heights that hold text
 * multiply by `min(fontScale, maxFontSizeMultiplier)`; grid geometry
 * (hour height, gutter, bars, widths) does not.
 */
export function getMetrics(
  bp: Breakpoint,
  fontScale = 1,
  maxFontSizeMultiplier = 1.5,
): CalendarMetrics {
  const b = BASE[bp];
  const s = Math.min(fontScale, maxFontSizeMultiplier);
  const k = (n: number) => n * s;
  return {
    header: {
      ...b.header,
      titleFontSize: k(b.header.titleFontSize),
      controlHeight: k(b.header.controlHeight),
      height: k(b.header.height),
    },
    month: {
      ...b.month,
      headerRowHeight: k(b.month.headerRowHeight),
      headerFontSize: k(b.month.headerFontSize),
      labelSize: k(b.month.labelSize),
      labelFontSize: k(b.month.labelFontSize),
      chipHeight: k(b.month.chipHeight),
      chipFontSize: k(b.month.chipFontSize),
      moreFontSize: k(b.month.moreFontSize),
    },
    timeGrid: {
      ...b.timeGrid,
      dayNameFontSize: k(b.timeGrid.dayNameFontSize),
      dayNumberFontSize: k(b.timeGrid.dayNumberFontSize),
      customCircle: k(b.timeGrid.customCircle),
      eventFontSize: k(b.timeGrid.eventFontSize),
    },
    banner: {
      chipHeight: k(b.banner.chipHeight),
      rowHeight: k(b.banner.rowHeight),
      fontSize: k(b.banner.fontSize),
      gmtFontSize: k(b.banner.gmtFontSize),
      minHeight: k(b.banner.minHeight),
    },
    schedule: {
      ...b.schedule,
      circle: k(b.schedule.circle),
      numberFontSize: k(b.schedule.numberFontSize),
      timeFontSize: k(b.schedule.timeFontSize),
      titleFontSize: k(b.schedule.titleFontSize),
    },
    sheet: { ...b.sheet, rowHeight: k(b.sheet.rowHeight) },
    touchTarget: Platform.OS === "android" ? 48 : 44,
  };
}
