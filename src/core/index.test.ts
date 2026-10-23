import { it, expect } from "vitest";
import * as core from ".";

it.each([
  "buildMonthGrid",
  "layoutAllDayBanner",
  "layoutDayEvents",
  "groupScheduleEvents",
  "getScheduleTimeLabel",
  "getScheduleTitle",
  "getVisibleDays",
  "getVisibleRange",
  "getHeaderTitle",
  "calendarReducer",
  "createInitialState",
  "getNavigatedDate",
  "validateEvents",
  "getEventWarnings",
  "resolveMessages",
  "resolveWeekStart",
  "resolveIs12Hour",
  "buildLabelCache",
  "getContrastColor",
  "resolveTheme",
  "calculateMaxEvents",
  "resolveDirection",
  "dateFn",
])("exports %s", (name) =>
  expect(typeof (core as Record<string, unknown>)[name]).toBe("function"),
);
