/**
 * Records `media/drag-resize.gif` for the README: in Week view a long press
 * lifts an event, it moves a day later and an hour down, then its bottom
 * edge is dragged to make it 30 minutes longer.
 *
 * Needs the web export (`npm run example:web:export`); `npm run readme:gif`
 * builds it first. Frames are cropped to the calendar (no example chrome)
 * and encoded with gifenc: one shared palette, and each frame after the
 * first draws only the pixels that changed (the rest is transparent), which
 * keeps the file small.
 */
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import gifenc from "gifenc";
import { PNG } from "pngjs";

const { GIFEncoder, quantize, applyPalette } = gifenc;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "example", "dist");
const OUT = join(ROOT, "media", "drag-resize.gif");
/** `--frames <dir>`: also save every frame as a PNG there (to review). */
const framesArg = process.argv.indexOf("--frames");
const FRAMES_DIR = framesArg > 0 ? process.argv[framesArg + 1] : undefined;
/** Frame time while something moves (about 12 frames per second). */
const FRAME_MS = 80;

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".json": "application/json",
};

/** Serves `example/dist` on a free port (single-page fallback to index). */
function serve() {
  const server = http.createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://x").pathname;
    let rel = normalize(decodeURIComponent(path)).replace(/^\/+/, "");
    if (!rel || rel.endsWith("/")) rel = join(rel, "index.html");
    try {
      const body = await readFile(join(DIST, rel));
      res.writeHead(200, {
        "content-type": TYPES[extname(rel)] ?? "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

async function main() {
  const server = await serve();
  const { port } = server.address();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1194, height: 844 },
    deviceScaleFactor: 1,
    timezoneId: "UTC",
  });
  await page.clock.setFixedTime(new Date("2026-10-22T10:40:00Z"));
  await page.goto(`http://localhost:${port}/?screen=drag&scheme=light`);

  const calendar = page.locator('[data-testid="calendar-container"]');
  const item = page.locator('[data-testid="calendar-review-day-event-item"]');
  await item.waitFor();
  await item.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const clip = await calendar.boundingBox();
  if (!clip) throw new Error("calendar not found");

  /** @type {{ png: Buffer, delay: number }[]} */
  const frames = [];
  const shot = async (delay = FRAME_MS) =>
    frames.push({ png: await page.screenshot({ clip }), delay });

  /** Long press at (x, y), move by (dx, dy) in `steps`, release. */
  const gesture = async (x, y, dx, dy, steps) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await shot(FRAME_MS);
    await page.waitForTimeout(450); // longer than the 250 ms long press
    await shot(400);
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(x + (dx * i) / steps, y + (dy * i) / steps);
      await shot();
    }
    await shot(300);
    await page.mouse.up();
    await page.waitForTimeout(300);
    await shot(900);
  };

  await shot(1200);
  // Move: a day later and an hour down (60 px per hour).
  let box = await item.boundingBox();
  const column = box.width + 2;
  await gesture(
    box.x + Math.min(40, box.width / 2),
    box.y + box.height / 2,
    column,
    60,
    16,
  );
  // Resize: drag the bottom edge 30 minutes lower.
  box = await item.boundingBox();
  await gesture(
    box.x + Math.min(40, box.width / 2),
    box.y + box.height - 3,
    0,
    30,
    10,
  );
  await shot(1500);

  await browser.close();
  server.close();

  if (FRAMES_DIR) {
    await mkdir(FRAMES_DIR, { recursive: true });
    await Promise.all(
      frames.map(({ png }, i) =>
        writeFile(join(FRAMES_DIR, `${String(i).padStart(2, "0")}.png`), png),
      ),
    );
  }

  // Decode; one palette for every frame (sampled from a few of them).
  const images = frames.map(({ png }) => PNG.sync.read(png));
  const { width, height } = images[0];
  const sample = [0, Math.floor(images.length / 2), images.length - 1]
    .map((i) => images[i].data)
    .reduce((all, d) => {
      const merged = new Uint8Array(all.length + d.length);
      merged.set(all);
      merged.set(d, all.length);
      return merged;
    }, new Uint8Array());
  const palette = quantize(sample, 255, { format: "rgb565" });
  const transparent = palette.length; // one spare index
  const fullPalette = [...palette, [0, 0, 0]];

  const gif = GIFEncoder();
  let previous;
  images.forEach((img, i) => {
    const index = applyPalette(img.data, palette, "rgb565");
    if (previous) {
      for (let p = 0; p < index.length; p++) {
        if (index[p] === previous[p]) index[p] = transparent;
      }
    }
    gif.writeFrame(index, width, height, {
      palette: i === 0 ? fullPalette : undefined,
      delay: frames[i].delay,
      transparent: i > 0,
      transparentIndex: transparent,
      dispose: 1, // keep the previous frame under the changed pixels
      repeat: 0,
    });
    // Track the drawn image, not the transparent mask.
    previous = previous
      ? previous.map((v, p) => (index[p] === transparent ? v : index[p]))
      : index;
  });
  gif.finish();
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, gif.bytes());
  console.log(
    `${OUT}: ${width}×${height}, ${images.length} frames, ${(gif.bytes().length / 1024).toFixed(0)} KB`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
