import { ESLint } from "eslint";
import { describe, it, expect } from "vitest";

describe("core import boundary", () => {
  const eslint = new ESLint({ cwd: process.cwd() });
  it.each(["react", "react-native", "react-dom"])(
    "rejects %s in src/core",
    async (mod) => {
      const [res] = await eslint.lintText(
        `import x from "${mod}";\nexport default x;\n`,
        { filePath: "src/core/probe.ts" },
      );
      expect(
        res?.messages.some((m) => m.ruleId === "no-restricted-imports"),
      ).toBe(true);
    },
  );
  it("allows luxon in src/core", async () => {
    const [res] = await eslint.lintText(
      `import { DateTime } from "luxon";\nexport const d = DateTime.now();\n`,
      { filePath: "src/core/probe.ts" },
    );
    expect(
      res?.messages.filter((m) => m.ruleId === "no-restricted-imports"),
    ).toHaveLength(0);
  });
});
