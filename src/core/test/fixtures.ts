/**
 * @file Shared core test fixtures.
 */
import type { BaseCalendarEvent } from "../types";

/** The prototype data set (October 2026), ids o1…o31. */
export const OCT_2026_EVENTS: BaseCalendarEvent[] = [
  {
    id: "o1",
    title: "Board meeting",
    startDate: "2026-10-01T10:00:00",
    endDate: "2026-10-01T12:00:00",
  },
  {
    id: "o2",
    title: "Sprint planning",
    startDate: "2026-10-05T10:00:00",
    endDate: "2026-10-05T11:00:00",
  },
  {
    id: "o3",
    title: "Dentist",
    startDate: "2026-10-07T15:30:00",
    endDate: "2026-10-07T16:15:00",
    color: "#c2410c",
  },
  {
    id: "o4",
    title: "Yoga",
    startDate: "2026-10-09T07:00:00",
    endDate: "2026-10-09T08:00:00",
    color: "#7e22ce",
  },
  {
    id: "o5",
    title: "Design offsite",
    startDate: "2026-10-12",
    endDate: "2026-10-14",
    color: "#15803d",
  },
  { id: "o6", title: "App release", startDate: "2026-10-16" },
  {
    id: "o7",
    title: "On call",
    startDate: "2026-10-17",
    endDate: "2026-10-20",
    color: "#c2410c",
  },
  {
    id: "o8",
    title: "Design sprint",
    startDate: "2026-10-19",
    endDate: "2026-10-22",
    color: "#7e22ce",
  },
  {
    id: "o9",
    title: "Sprint planning",
    startDate: "2026-10-19T10:00:00",
    endDate: "2026-10-19T11:30:00",
  },
  {
    id: "o10",
    title: "Lunch with Priya",
    startDate: "2026-10-19T12:30:00",
    endDate: "2026-10-19T13:30:00",
    color: "#15803d",
  },
  {
    id: "o11",
    title: "Release freeze",
    startDate: "2026-10-20",
    endDate: "2026-10-24",
  },
  {
    id: "o12",
    title: "1:1 with manager",
    startDate: "2026-10-20T16:00:00",
    endDate: "2026-10-20T16:30:00",
  },
  {
    id: "o13",
    title: "Customer call",
    startDate: "2026-10-21T09:00:00",
    endDate: "2026-10-21T10:00:00",
    color: "#c2410c",
  },
  {
    id: "o14",
    title: "Code review",
    startDate: "2026-10-21T09:30:00",
    endDate: "2026-10-21T10:30:00",
  },
  {
    id: "o15",
    title: "Focus time",
    startDate: "2026-10-21T14:00:00",
    endDate: "2026-10-21T16:00:00",
    color: "#7e22ce",
  },
  {
    id: "o16",
    title: "Hackathon",
    startDate: "2026-10-22",
    endDate: "2026-10-23",
    color: "#15803d",
  },
  {
    id: "o17",
    title: "Sam's birthday",
    startDate: "2026-10-22",
    color: "#c2410c",
  },
  { id: "o18", title: "Payroll", startDate: "2026-10-22" },
  {
    id: "o19",
    title: "Stand-up",
    startDate: "2026-10-22T09:30:00",
    endDate: "2026-10-22T09:45:00",
  },
  {
    id: "o20",
    title: "Design review",
    startDate: "2026-10-22T11:00:00",
    endDate: "2026-10-22T12:00:00",
    color: "#c2410c",
  },
  {
    id: "o21",
    title: "Interview",
    startDate: "2026-10-22T11:30:00",
    endDate: "2026-10-22T12:30:00",
    color: "#7e22ce",
  },
  {
    id: "o22",
    title: "Gym",
    startDate: "2026-10-22T18:30:00",
    endDate: "2026-10-22T19:30:00",
    color: "#15803d",
  },
  {
    id: "o23",
    title: "Design QA",
    startDate: "2026-10-23T10:00:00",
    endDate: "2026-10-23T11:00:00",
    color: "#c2410c",
  },
  {
    id: "o24",
    title: "Team retro",
    startDate: "2026-10-23T15:00:00",
    endDate: "2026-10-23T16:00:00",
  },
  {
    id: "o25",
    title: "Dinner with Sam",
    startDate: "2026-10-23T19:30:00",
    endDate: "2026-10-23T21:00:00",
    color: "#c2410c",
  },
  {
    id: "o26",
    title: "Conference",
    startDate: "2026-10-24",
    endDate: "2026-10-26",
    color: "#7e22ce",
  },
  {
    id: "o27",
    title: "Hike",
    startDate: "2026-10-24T08:00:00",
    endDate: "2026-10-24T12:00:00",
    color: "#15803d",
  },
  {
    id: "o28",
    title: "Quarterly review",
    startDate: "2026-10-26T14:00:00",
    endDate: "2026-10-26T16:00:00",
  },
  {
    id: "o29",
    title: "Flight to Berlin",
    startDate: "2026-10-29T07:15:00",
    endDate: "2026-10-29T09:40:00",
    color: "#7e22ce",
  },
  {
    id: "o30",
    title: "Talk rehearsal",
    startDate: "2026-10-30T08:00:00",
    endDate: "2026-10-30T08:45:00",
  },
  {
    id: "o31",
    title: "Halloween party",
    startDate: "2026-10-31T19:00:00",
    endDate: "2026-10-31T23:00:00",
    color: "#c2410c",
  },
];

let counter = 0;

/** Builds an event, filling `id` from a counter and `title` with "Event". */
export function ev(
  partial: Partial<BaseCalendarEvent> & { startDate: string },
): BaseCalendarEvent {
  counter += 1;
  return { id: `e${counter}`, title: "Event", ...partial };
}
