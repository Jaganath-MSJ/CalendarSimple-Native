/**
 * Type-checks every ```tsx block in README.md and MIGRATION.md.
 *
 * Each block is written to `.tmp/snippets/<file>-<n>.tsx`. Blocks that do not
 * import "calendar-simple-native" themselves get
 * `import Calendar, * as CSN from "calendar-simple-native";` prepended.
 * A temp tsconfig maps the package name to `src/index.ts`, then
 * `tsc --noEmit` runs on the snippets. Exit code is tsc's.
 *
 * Usage: node scripts/check-readme-snippets.mjs [--keep]
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, ".tmp", "snippets");
const sources = ["README.md", "MIGRATION.md"];
const PACKAGE = "calendar-simple-native";
const PREFIX = `import Calendar, * as CSN from "${PACKAGE}";\n`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const files = [];
for (const source of sources) {
  const path = join(root, source);
  if (!existsSync(path)) continue;
  const text = readFileSync(path, "utf8");
  const blocks = [...text.matchAll(/^```tsx[^\n]*\n([\s\S]*?)^```/gm)];
  blocks.forEach((match, i) => {
    const code = match[1] ?? "";
    const importsPackage = new RegExp(`from "${PACKAGE}"`).test(code);
    const name = `${source.replace(/\.md$/, "").toLowerCase()}-${i + 1}.tsx`;
    writeFileSync(join(outDir, name), (importsPackage ? "" : PREFIX) + code);
    files.push(name);
  });
}

console.log(`docs:check: ${files.length} tsx snippet(s) found`);
if (files.length === 0) process.exit(0);

const tsconfig = {
  extends: "../../tsconfig.json",
  compilerOptions: {
    rootDir: "../..",
    noEmit: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    types: ["node"],
    paths: { [PACKAGE]: ["../../src/index.ts"] },
  },
  files,
};
writeFileSync(join(outDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));

const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
const result = spawnSync(
  process.execPath,
  [tsc, "-p", join(outDir, "tsconfig.json")],
  {
    cwd: root,
    stdio: "inherit",
  },
);

if (!process.argv.includes("--keep") && result.status === 0) {
  rmSync(join(root, ".tmp"), { recursive: true, force: true });
}
if (result.status === 0) console.log("docs:check: all snippets type-check");
process.exit(result.status ?? 1);
