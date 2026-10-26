#!/usr/bin/env node
/**
 * Prints `diff -u` between each web file and its native port, using the
 * "Web file → native file" table in src/core/SOURCE.md.
 *
 * WEB_REPO (default ../CalendarSimple) points at the web checkout.
 * Native cells may list several files (comma-separated); the first one is
 * diffed and the rest are named. Text in parentheses is a note and ignored.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webRepo = resolve(root, process.env.WEB_REPO ?? "../CalendarSimple");
const source = readFileSync(resolve(root, "src/core/SOURCE.md"), "utf8");

const section = source.split("## Web file → native file")[1]?.split("\n## ")[0];
if (!section) {
  console.error("core:diff: file map not found in src/core/SOURCE.md");
  process.exit(1);
}

/** Backticked paths in a cell, ignoring anything inside parentheses. */
const paths = (cell) =>
  [...cell.replace(/\([^)]*\)/g, "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);

let missing = 0;
for (const line of section.split("\n")) {
  if (!line.startsWith("|") || line.includes("---")) continue;
  const cells = line.split("|").slice(1, -1);
  if (cells.length < 2) continue;
  const [web] = paths(cells[0]);
  const [native, ...extra] = paths(cells[1]);
  if (!web || !native) continue;

  const webFile = resolve(webRepo, web);
  const nativeFile = resolve(root, native);
  console.log(
    `\n=== ${web} → ${native}${extra.length ? ` (+ ${extra.join(", ")})` : ""}`,
  );
  if (!existsSync(webFile) || !existsSync(nativeFile)) {
    console.log(`missing: ${existsSync(webFile) ? nativeFile : webFile}`);
    missing += 1;
    continue;
  }
  const out = spawnSync("diff", ["-u", webFile, nativeFile], {
    encoding: "utf8",
  });
  process.stdout.write(out.stdout);
}
process.exit(missing > 0 ? 1 : 0);
