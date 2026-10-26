import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
// Test-only parity oracle: calendarize is a devDependency, never imported by src/core code.
import calendarize from "calendarize";
import { buildMonthMatrix } from "./monthMatrix";

describe("buildMonthMatrix", () => {
  it("matches calendarize for 2020–2030 and every week start", () => {
    for (let y = 2020; y <= 2030; y++)
      for (let m = 0; m < 12; m++)
        for (let s = 0; s < 7; s++) {
          const d = DateTime.local(y, m + 1, 15);
          expect(buildMonthMatrix(d, s)).toEqual(calendarize(d.toJSDate(), s));
        }
  });
});
