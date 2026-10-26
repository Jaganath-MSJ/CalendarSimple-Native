// Compile-time checks, enforced by `tsc --noEmit` (npm run lint). The `it`
// wrapper only exists because Jest fails a file that declares no tests.
import { expectTypeOf } from "expect-type";
import type { CalendarProps, CalendarEvent } from ".";

interface Meeting extends CalendarEvent {
  roomId: string;
}
type P = CalendarProps<Meeting>;

it("keeps the event type parameter through callbacks", () => {
  expectTypeOf<
    Parameters<NonNullable<P["onEventClick"]>>[0]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<
    Parameters<NonNullable<P["renderEvent"]>>[0]
  >().toEqualTypeOf<Meeting>();
  expectTypeOf<Parameters<NonNullable<P["onMoreClick"]>>[1]>().toEqualTypeOf<
    Meeting[]
  >();
  expectTypeOf<NonNullable<P["sortedMonthView"]>>().toEqualTypeOf<
    boolean | ((a: Meeting, b: Meeting) => number)
  >();
  expectTypeOf<NonNullable<CalendarEvent["style"]>>().toEqualTypeOf<{
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    opacity?: number;
  }>();
});
