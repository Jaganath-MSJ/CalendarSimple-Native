/**
 * @file Event sets shared by the parity screens (mirroring the web stories).
 */
import { DateTime } from "luxon";
import type { CalendarEvent } from "../../../src";

export const today = DateTime.now();
const day = today.toFormat("yyyy-MM-dd");

/** `"yyyy-MM-ddTHH:mm:00"` for today (plus `days`) at `hour:minute`. */
export function at(hour: number, minute = 0, days = 0): string {
  return today
    .plus({ days })
    .set({ hour, minute })
    .toFormat("yyyy-MM-dd'T'HH:mm:00");
}

/** The five all-day events of `Features.stories.tsx`. */
export const featureEvents: CalendarEvent[] = [
  ["1", "Morning Meeting", "#3B82F6"],
  ["2", "Lunch Break", "#F59E0B"],
  ["3", "Focus Time", "#10B981"],
  ["4", "Team Sync", "#8B5CF6"],
  ["5", "Project Review", "#EF4444"],
].map(([id, title, backgroundColor]) => ({
  id,
  title: title as string,
  startDate: day,
  style: { backgroundColor },
}));

/** Two timed events (`Localization.stories.tsx`). */
export const localeEvents: CalendarEvent[] = [
  {
    id: "1",
    startDate: today.plus({ hours: 2 }).toISO() ?? day,
    endDate: today.plus({ hours: 3 }).toISO() ?? day,
    title: "Meeting",
    style: { backgroundColor: "#e0f2fe" },
  },
  {
    id: "2",
    startDate: today.plus({ days: 1, hours: 10 }).toISO() ?? day,
    endDate: today.plus({ days: 1, hours: 12 }).toISO() ?? day,
    title: "Project Sync",
    style: { backgroundColor: "#dcfce7" },
  },
];

/** Three meetings today (`Accessibility.stories.tsx`). */
export const a11yEvents: CalendarEvent[] = [
  { id: "a11y-1", title: "Team Meeting", startDate: at(10), endDate: at(11) },
  { id: "a11y-2", title: "Design Review", startDate: at(14), endDate: at(15) },
  {
    id: "a11y-3",
    title: "Planning Session",
    startDate: at(16),
    endDate: at(17),
  },
];
