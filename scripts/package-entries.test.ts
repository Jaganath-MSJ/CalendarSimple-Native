import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Every entry an app can import must resolve to the same build, whatever the
// bundler reads (`exports`, `main`, `react-native`, ...). If
// `calendar-simple-native` and `calendar-simple-native/gestures` came from
// different folders (lib vs src), each would get its own copy of the
// gesture context, and <CalendarGestures> would never reach <Calendar>.
const root = join(__dirname, "..");
const read = (p: string) =>
  JSON.parse(readFileSync(join(root, p), "utf8")) as Record<string, unknown>;

const RESOLVER_FIELDS = ["main", "module", "react-native", "browser", "source"];

describe("package entries", () => {
  const pkg = read("package.json");
  const stub = read("gestures/package.json");

  it("the gestures stub uses no resolver field the root does not", () => {
    for (const field of RESOLVER_FIELDS)
      if (field in stub) expect(pkg).toHaveProperty(field);
  });

  it("both entries point into lib/module", () => {
    expect(pkg.main).toBe("./lib/module/index.js");
    expect(stub.main).toBe("../lib/module/gestures/index.js");
    const exp = pkg.exports as Record<string, Record<string, string>>;
    expect(exp["."]!.default).toBe("./lib/module/index.js");
    expect(exp["./gestures"]!.default).toBe("./lib/module/gestures/index.js");
  });
});
