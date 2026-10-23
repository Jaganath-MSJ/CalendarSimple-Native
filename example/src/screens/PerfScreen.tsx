/**
 * @file Performance screen (P9.S4): 1,000 generated events, a frame counter
 * overlay fed by `requestAnimationFrame` deltas, and an auto-run that
 * measures first render per view and navigation commits.
 *
 * Results show on screen and are logged as `PERF {json}` lines, so a release
 * build's device log can be read back. `EXPO_PUBLIC_PERF_AUTORUN=1` starts the
 * run on mount.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Calendar from "../../../src";
import { dateFn } from "../../../src/core";
import type { ECalendarViewType } from "../../../src/core";
import { generateEvents } from "../perf/generateEvents";
import { useExampleScheme } from "../launch";

const ANCHOR = new Date(2026, 9, 22);
const EVENTS = generateEvents(1000, 42, dateFn(ANCHOR));
const VIEWS: ECalendarViewType[] = ["month", "week", "day", "schedule"];
const STEPS = 10;
const JANK_MS = 1000 / 60 + 4; // a frame later than ~60 fps plus slack

interface FrameStats {
  fps: number;
  worstMs: number;
  janky: number;
}

/** rAF deltas over the last second. */
function useFrameStats(): FrameStats {
  const [stats, setStats] = useState<FrameStats>({
    fps: 0,
    worstMs: 0,
    janky: 0,
  });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let windowStart = last;
    let frames = 0;
    let worst = 0;
    let janky = 0;
    const tick = (t: number) => {
      const d = t - last;
      last = t;
      frames++;
      worst = Math.max(worst, d);
      if (d > JANK_MS) janky++;
      if (t - windowStart >= 1000) {
        setStats({
          fps: Math.round((frames * 1000) / (t - windowStart)),
          worstMs: Math.round(worst),
          janky,
        });
        windowStart = t;
        frames = 0;
        worst = 0;
        janky = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return stats;
}

/** Resolves after the next painted frame. */
const nextFrame = () =>
  new Promise<number>((r) => requestAnimationFrame(() => r(performance.now())));

/** Records rAF deltas between `start()` and `stop()`. */
function frameRecorder() {
  const deltas: number[] = [];
  let raf = 0;
  let last = 0;
  const loop = (t: number) => {
    if (last) deltas.push(t - last);
    last = t;
    raf = requestAnimationFrame(loop);
  };
  return {
    start: () => {
      raf = requestAnimationFrame(loop);
    },
    stop: () => {
      cancelAnimationFrame(raf);
      const total = deltas.reduce((a, b) => a + b, 0);
      return {
        fps: deltas.length ? Math.round((deltas.length * 1000) / total) : 0,
        worstMs: Math.round(Math.max(0, ...deltas)),
        janky: deltas.filter((d) => d > JANK_MS).length,
        frames: deltas.length,
      };
    },
  };
}

const log = (entry: object) => {
  // eslint-disable-next-line no-console -- read back from the device log
  console.log(`PERF ${JSON.stringify(entry)}`);
};

export default function PerfScreen() {
  const scheme = useExampleScheme();
  const stats = useFrameStats();
  const [view, setView] = useState<ECalendarViewType>(VIEWS[0]!);
  const [date, setDate] = useState(ANCHOR);
  const [mountKey, setMountKey] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  const running = useRef(false);

  const add = useCallback((line: string, entry: object) => {
    log(entry);
    setResults((r) => [...r, line]);
  }, []);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setResults([]);
    await nextFrame();
    for (const v of VIEWS) {
      // First render: a fresh mount of the view with 1,000 events.
      const t0 = performance.now();
      setView(v);
      setDate(ANCHOR);
      setMountKey((k) => k + 1);
      await nextFrame();
      const t1 = await nextFrame();
      const firstRender = Math.round(t1 - t0);
      await new Promise((r) => setTimeout(r, 500)); // neighbours mount
      // Navigation: what a swipe's momentum end does (one period per step).
      const rec = frameRecorder();
      rec.start();
      const commits: number[] = [];
      for (let i = 1; i <= STEPS; i++) {
        const s = performance.now();
        setDate(
          dateFn(ANCHOR)
            .plus({ days: i * 7 })
            .toJSDate(),
        );
        await nextFrame();
        commits.push(performance.now() - s);
        await new Promise((r) => setTimeout(r, 150));
      }
      const frames = rec.stop();
      const avg = Math.round(commits.reduce((a, b) => a + b, 0) / STEPS);
      const worst = Math.round(Math.max(...commits));
      add(
        `${v}: first ${firstRender} ms · nav avg ${avg} / worst ${worst} ms · ${frames.fps} fps, worst frame ${frames.worstMs} ms, ${frames.janky} janky`,
        {
          view: v,
          firstRenderMs: firstRender,
          navAvgMs: avg,
          navWorstMs: worst,
          ...frames,
        },
      );
    }
    log({ done: true });
    running.current = false;
  }, [add]);

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_PERF_AUTORUN === "1") void run();
  }, [run]);

  return (
    <View style={styles.root}>
      <View style={styles.bar}>
        <Pressable
          testID="perf-run"
          accessibilityRole="button"
          onPress={() => void run()}
          style={styles.button}
        >
          <Text>Run</Text>
        </Pressable>
        <Text testID="perf-fps" style={styles.fps}>
          {`${stats.fps} fps · worst ${stats.worstMs} ms · ${stats.janky} janky`}
        </Text>
      </View>
      {results.map((r) => (
        <Text key={r} style={styles.result}>
          {r}
        </Text>
      ))}
      <View style={styles.fill}>
        <Calendar
          colorScheme={scheme}
          key={mountKey}
          view={view}
          onViewChange={setView}
          selectedDate={date}
          onNavigate={setDate}
          events={EVENTS}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  button: { padding: 8, borderWidth: 1, borderRadius: 6 },
  fps: { fontVariant: ["tabular-nums"] },
  result: { fontSize: 11, paddingHorizontal: 12 },
});
