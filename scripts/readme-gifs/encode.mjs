/**
 * Encodes a folder of PNG frames (0000.png, 0001.png, …) into a looping GIF.
 *
 *   node encode.mjs <frames-dir> <out.gif> <frame-ms> [<hold-last-ms>] [<max-still-ms>]
 *
 * One palette for every frame (sampled from all of them),
 * and each frame after the first draws only the pixels that changed (the
 * rest is transparent), which keeps the file small. Frames identical to the
 * previous one are merged into it (their time is added to its delay, up
 * to <max-still-ms>, so waiting for the next step does not show as a pause).
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import gifenc from "gifenc";
import { PNG } from "pngjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;

const [dir, out, frameArg, holdArg, stillArg] = process.argv.slice(2);
if (!dir || !out || !frameArg) {
  console.error(
    "usage: encode.mjs <frames-dir> <out.gif> <frame-ms> [hold-last-ms] [max-still-ms]",
  );
  process.exit(2);
}
const frameMs = Number(frameArg);
const holdMs = Number(holdArg ?? 0);
const maxStillMs = Number(stillArg ?? Infinity);

const files = (await readdir(dir)).filter((f) => f.endsWith(".png")).sort();
const images = await Promise.all(
  files.map(async (f) => PNG.sync.read(await readFile(join(dir, f)))),
);
if (images.length === 0) throw new Error(`no frames in ${dir}`);
const { width, height } = images[0];

// Every frame contributes (every 3rd pixel), so colours that appear in only
// a few frames, such as thin grid lines, keep a palette entry.
const STRIDE = 3;
const sample = new Uint8Array(
  images.reduce((n, img) => n + Math.ceil(img.data.length / 4 / STRIDE) * 4, 0),
);
let at = 0;
for (const img of images) {
  for (let p = 0; p < img.data.length; p += 4 * STRIDE) {
    sample.set(img.data.subarray(p, p + 4), at);
    at += 4;
  }
}
const palette = quantize(sample, 255, { format: "rgb565" });
const transparent = palette.length; // one spare index
const fullPalette = [...palette, [0, 0, 0]];

// Map every frame to the palette and merge runs of identical frames.
/** @type {{ index: Uint8Array, delay: number }[]} */
const frames = [];
for (const img of images) {
  const index = applyPalette(img.data, palette, "rgb565");
  const last = frames[frames.length - 1];
  if (last && last.index.every((v, p) => v === index[p]))
    last.delay = Math.min(last.delay + frameMs, maxStillMs);
  else frames.push({ index, delay: frameMs });
}
frames[frames.length - 1].delay += holdMs;

const gif = GIFEncoder();
let previous;
frames.forEach(({ index, delay }, i) => {
  const drawn = index.slice();
  if (previous) {
    for (let p = 0; p < drawn.length; p++) {
      if (drawn[p] === previous[p]) drawn[p] = transparent;
    }
  }
  gif.writeFrame(drawn, width, height, {
    palette: i === 0 ? fullPalette : undefined,
    delay,
    transparent: i > 0,
    transparentIndex: transparent,
    dispose: 1, // keep the previous frame under the changed pixels
    repeat: 0,
  });
  previous = index;
});
gif.finish();
await mkdir(dirname(out), { recursive: true });
await writeFile(out, gif.bytes());
console.log(
  `${out}: ${width}×${height}, ${frames.length} frames, ${(gif.bytes().length / 1024).toFixed(0)} KB`,
);
