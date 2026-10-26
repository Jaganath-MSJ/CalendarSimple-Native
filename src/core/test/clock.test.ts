import { describe, it, expect, afterEach } from "vitest";
import { DateTime } from "luxon";
import { freezeNow, restoreNow, withZone } from "./clock";
import { OCT_2026_EVENTS } from "./fixtures";

afterEach(restoreNow);
describe("test helpers", () => {
  it("freezes Luxon now", () => {
    freezeNow("2026-10-22T10:40:00");
    expect(DateTime.now().toFormat("yyyy-MM-dd HH:mm")).toBe(
      "2026-10-22 10:40",
    );
  });
  it("runs in a zone and restores it", () => {
    const zone = withZone("Pacific/Chatham", () => DateTime.now().zoneName);
    expect(zone).toBe("Pacific/Chatham");
    expect(DateTime.now().zoneName).not.toBe("Pacific/Chatham");
  });
  it("has the 31 sample events", () =>
    expect(OCT_2026_EVENTS).toHaveLength(31));
});
