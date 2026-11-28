import { eventFocus, focusKey } from "./focusAfterMove";

describe("focus after a keyboard move", () => {
  it("the moved event's key matches its redrawn self", () => {
    const before = { id: "m", title: "M", startDate: "2026-10-22T09:00:00" };
    const after = { ...before, startDate: "2026-10-23T09:15:00" };
    expect(focusKey(eventFocus(before), 1, 15)).toBe(
      focusKey(eventFocus(after)),
    );
  });
  it("a recurring occurrence keeps its series key though its id changes", () => {
    const occ = {
      id: "s::2026-10-22",
      recurringEventId: "s",
      title: "Stand-up",
      startDate: "2026-10-22T09:00:00",
    };
    const moved = {
      ...occ,
      id: "s::2026-10-23",
      startDate: "2026-10-23T09:00:00",
    };
    const other = {
      ...occ,
      id: "s::2026-10-24",
      startDate: "2026-10-24T09:00:00",
    };
    expect(focusKey(eventFocus(occ), 1)).toBe(focusKey(eventFocus(moved)));
    expect(focusKey(eventFocus(occ), 1)).not.toBe(focusKey(eventFocus(other)));
  });
});
