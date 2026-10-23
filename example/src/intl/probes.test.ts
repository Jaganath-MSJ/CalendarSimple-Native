import { describe, it, expect } from "vitest";
import * as p from "./probes";

describe("Intl probes (Node full-ICU baseline)", () => {
  it("long French months", () =>
    expect(p.probeMonthsLong("fr")[0]).toBe("janvier"));
  it("short Japanese weekdays", () =>
    expect(p.probeWeekdaysShort("ja")).toHaveLength(7));
  it("Korean day period for 13:00", () =>
    expect(p.probeMeridiem("ko")).toBe("오후"));
  it("Arabic-Egypt digits", () => expect(p.probeDigits("ar-EG")).toBe("١٢٣"));
  it("week start", () => {
    const v = p.probeWeekStart("en-GB");
    expect(v === null || v === 1).toBe(true);
    if (v !== null) expect(p.probeWeekStart("en-US")).toBe(0);
  });
  it("hour cycle", () => {
    expect(["h11", "h12", null]).toContain(p.probeHourCycle("en-US"));
    expect(["h23", "h24", null]).toContain(p.probeHourCycle("en-GB"));
  });
});
