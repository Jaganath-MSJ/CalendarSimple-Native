import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  outputDir: "./test-results",
  // Baselines per OS: fonts and anti-aliasing differ between macOS and Linux.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{platform}{ext}",
  use: { baseURL: "http://localhost:4173" },
  webServer: {
    command: "npx serve example/dist -l 4173 -s",
    port: 4173,
    cwd: "..",
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
