// Compile-time checks, enforced by `tsc --noEmit` (npm run lint). The `it`
// wrapper only exists because Jest fails a file that declares no tests; the
// JSX cases live in a function that is never called.
import { Text } from "react-native";
import { expectTypeOf } from "expect-type";
import Calendar from "../index";
import type { CalendarProps, CalendarEvent } from ".";

interface Meeting extends CalendarEvent {
  roomId: string;
}
type P = CalendarProps<Meeting>;

it("keeps the event type parameter through every event-bearing prop", () => {
  expectTypeOf<NonNullable<P["events"]>>().toEqualTypeOf<Meeting[]>();
  expectTypeOf<
    Parameters<NonNullable<P["onEventClick"]>>[0]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<
    Parameters<NonNullable<P["onEventLongPress"]>>[0]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<
    Parameters<NonNullable<P["renderEvent"]>>[0]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<Parameters<NonNullable<P["onMoreClick"]>>[1]>().toEqualTypeOf<
    Meeting[]
  >();
  expectTypeOf<
    Parameters<NonNullable<P["onEventDrop"]>>[0]["event"]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<
    Parameters<NonNullable<P["onEventResize"]>>[0]["event"]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<NonNullable<P["draggable"]>>().toEqualTypeOf<
    boolean | ((event: Meeting) => boolean)
  >();
  expectTypeOf<NonNullable<P["resizable"]>>().toEqualTypeOf<
    boolean | ((event: Meeting) => boolean)
  >();
  expectTypeOf<NonNullable<P["enrichedEventsByDate"]>>().toEqualTypeOf<
    Record<string, Meeting[]>
  >();
  expectTypeOf<NonNullable<P["sortedMonthView"]>>().toEqualTypeOf<
    boolean | ((a: Meeting, b: Meeting) => number)
  >();
  // The default stays `CalendarEvent`.
  expectTypeOf<
    Parameters<NonNullable<CalendarProps["onEventClick"]>>[0]
  >().toEqualTypeOf<CalendarEvent>();
  expectTypeOf<NonNullable<CalendarEvent["style"]>>().toEqualTypeOf<{
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    opacity?: number;
  }>();
});

// The event type comes only from an explicit type argument, never from
// `events` or the callbacks (same as calendar-simple).
export function JsxCases(meetings: Meeting[]) {
  return (
    <>
      <Calendar<Meeting>
        events={meetings}
        onEventClick={(e) => {
          expectTypeOf(e.roomId).toEqualTypeOf<string>();
          // @ts-expect-error `missing` is not a field of Meeting
          void e.missing.length;
        }}
        renderEvent={(e) => <Text>{e.roomId}</Text>}
        onMoreClick={(_date, hidden) =>
          expectTypeOf(hidden).toEqualTypeOf<Meeting[]>()
        }
        sortedMonthView={(a, b) => a.roomId.localeCompare(b.roomId)}
      />
      {/* Without a type argument, TEvent is not inferred from `events`. */}
      <Calendar
        events={meetings}
        onEventClick={(e) => {
          expectTypeOf(e).toEqualTypeOf<CalendarEvent>();
          expectTypeOf(e.roomId).toEqualTypeOf<unknown>();
        }}
      />
      {/* An inline literal keeps plain CalendarEvent typing. */}
      <Calendar
        events={[{ id: "1", title: "Standup", startDate: "2026-11-21" }]}
        onEventClick={(e) => expectTypeOf(e.color).toEqualTypeOf<unknown>()}
        renderEvent={(e) => <Text>{String(e.color)}</Text>}
      />
      <Calendar />
      {/* @ts-expect-error events must match the explicit type argument */}
      <Calendar<Meeting> events={[{ title: "x", startDate: "2026-11-21" }]} />
    </>
  );
}
