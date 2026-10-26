import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/core/**/*.test.ts",
      "scripts/**/*.test.ts",
      "example/src/intl/**/*.test.ts",
    ],
    environment: "node",
    globals: false,
  },
});
