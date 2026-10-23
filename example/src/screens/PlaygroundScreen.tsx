/**
 * @file Parity with web `playground/Playground.stories.tsx` (Kitchen Sink):
 * a live calendar over a panel of the main props (View, Look, Locale, Data)
 * and the web test fixtures, with the matching JSX behind "Copy code".
 */
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Calendar, {
  ECalendarViewType,
  type CalendarProps,
  type CalendarTheme,
  type ColorScheme,
  type WeekdayIndex,
} from "../../../src";
import { OCT_2026_EVENTS } from "../../../src/core/test/fixtures";
import { PALETTE } from "../../../src/theme/palette";
import type { CalendarStyles, SlotPressMode } from "../../../src/types/props";
import { fixtureList, largeDataset_1k } from "../fixtures/webFixtures";
import { useExampleScheme } from "../launch";
import {
  BOTTOM_INSET,
  CodeModal,
  LinkButton,
  Pill,
  TOP_INSET,
  useChrome,
  useWide,
} from "../ui/chrome";

const VIEWS: [ECalendarViewType, string][] = [
  [ECalendarViewType.month, "Month"],
  [ECalendarViewType.week, "Week"],
  [ECalendarViewType.day, "Day"],
  [ECalendarViewType.customDays, "3 Days"],
  [ECalendarViewType.schedule, "Sched"],
];
const LOCALES = ["en", "en-GB", "fr", "de", "ja", "ko", "ar", "he"];
const SCHEMES: [ColorScheme, string][] = [
  ["auto", "Auto"],
  ["light", "Light"],
  ["dark", "Dark"],
];
const PRIMARIES = [PALETTE.light.primary, "#7c3aed", "#059669", "#db2777"];
const WEEK_STARTS: [WeekdayIndex | "locale", string][] = [
  ["locale", "Locale"],
  [0, "Sun"],
  [1, "Mon"],
  [6, "Sat"],
];
const STATE_THEME: CalendarTheme = {
  today: { color: "#ffffff", bgColor: "#ea4335" },
  selected: { color: "#ffffff", bgColor: "#7c3aed" },
};
const STYLE_SAMPLES: [string, CalendarStyles | undefined, string][] = [
  ["None", undefined, ""],
  [
    "Rounded",
    { event: { borderRadius: 10 } },
    "{ event: { borderRadius: 10 } }",
  ],
  [
    "Bold dates",
    { dayNumber: { fontWeight: "700" }, tableDate: { fontWeight: "700" } },
    '{ dayNumber: { fontWeight: "700" }, tableDate: { fontWeight: "700" } }',
  ],
];
const SAMPLE_DATE = new Date(2026, 9, 22);
const TABS = ["View", "Look", "Locale", "Data"] as const;
type Tab = (typeof TABS)[number];

type DataSet = "none" | "sample" | "1k" | number;

function Row({ label, children }: { label: string; children: ReactNode }) {
  const c = useChrome();
  return (
    <View style={s.row}>
      <Text style={[s.label, { color: c.textPrimary }]}>{label}</Text>
      <View style={s.options}>{children}</View>
    </View>
  );
}

/** A segmented choice: one Pill per option. */
function Choice<T>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Row label={label}>
      {options.map(([v, text]) => (
        <Pill
          key={text}
          label={text}
          selected={v === value}
          onPress={() => onChange(v)}
        />
      ))}
    </Row>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const c = useChrome();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={s.toggleRow}
    >
      <Text style={[s.label, { color: c.textPrimary }]}>{label}</Text>
      <View
        style={[
          s.track,
          { backgroundColor: value ? c.primary : c.border },
          value ? s.trackOn : null,
        ]}
      >
        <View style={[s.knob, { backgroundColor: "#ffffff" }]} />
      </View>
    </Pressable>
  );
}

function literal(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (value instanceof Date)
    return `new Date(${value.getFullYear()}, ${value.getMonth()}, ${value.getDate()})`;
  return `{${JSON.stringify(value)}}`;
}

/** The JSX for the non-default props. */
function toJsx(entries: [string, unknown, string?][]): string {
  const lines = entries.map(([name, value, raw]) =>
    value === true ? `  ${name}` : `  ${name}=${raw ?? literal(value)}`,
  );
  return [
    'import Calendar from "calendar-simple-native";',
    "",
    "<Calendar",
    "  events={events}",
    ...lines,
    "/>",
  ].join("\n");
}

export default function PlaygroundScreen({
  initialView = ECalendarViewType.month,
}: {
  initialView?: ECalendarViewType;
}) {
  const c = useChrome();
  const wide = useWide();
  const launchScheme = useExampleScheme();
  const [tab, setTab] = useState<Tab>("View");
  const [view, setView] = useState<ECalendarViewType>(initialView);
  const [useToday, setUseToday] = useState(false);
  const [weekStartsOn, setWeekStartsOn] = useState<WeekdayIndex | "locale">(
    "locale",
  );
  const [swipe, setSwipe] = useState(true);
  const [scheme, setScheme] = useState<ColorScheme>(launchScheme);
  const [primary, setPrimary] = useState(PRIMARIES[0]!);
  const [stateTheme, setStateTheme] = useState(false);
  const [styleSample, setStyleSample] = useState(0);
  const [locale, setLocale] = useState("en");
  const [is12Hour, setIs12Hour] = useState<boolean | "locale">("locale");
  const [data, setData] = useState<DataSet>("sample");
  const [isLoading, setIsLoading] = useState(false);
  const [maxEvents, setMaxEvents] = useState<number | undefined>(undefined);
  const [showAllDayRow, setShowAllDayRow] = useState(true);
  const [slotPressMode, setSlotPressMode] = useState<SlotPressMode>("press");
  const [code, setCode] = useState<string | null>(null);
  const [log, setLog] = useState("");

  const events = useMemo(() => {
    if (data === "none") return [];
    if (data === "sample") return OCT_2026_EVENTS;
    if (data === "1k") return largeDataset_1k();
    return fixtureList[data]?.fn() ?? [];
  }, [data]);
  const fixtureIndex = typeof data === "number" ? data : -1;
  const sample = STYLE_SAMPLES[styleSample] ?? STYLE_SAMPLES[0]!;
  const selectedDate = useMemo(
    () => (useToday ? new Date() : SAMPLE_DATE),
    [useToday],
  );
  const palettePrimary =
    primary === PRIMARIES[0]
      ? undefined
      : { light: { primary }, dark: { primary } };

  const props: CalendarProps = {
    view,
    events,
    selectedDate,
    locale,
    colorScheme: scheme,
    customDays: 3,
    weekStartsOn,
    swipeNavigation: swipe,
    is12Hour,
    isLoading,
    maxEvents,
    showAllDayRow,
    slotPressMode,
    selectable: true,
    creatable: true,
    theme: stateTheme ? STATE_THEME : undefined,
    styles: sample[1],
    palette: palettePrimary,
    onViewChange: setView,
    onEventClick: (e) => setLog(`onEventClick ${e.title}`),
    onDateClick: (d) => setLog(`onDateClick ${d.toDateString()}`),
    onSlotClick: (st, en) =>
      setLog(`onSlotClick ${st.toLocaleString()} - ${en.toLocaleTimeString()}`),
  };

  const jsx = () => {
    const out: [string, unknown, string?][] = [];
    if (view !== ECalendarViewType.month) out.push(["view", view]);
    if (view === ECalendarViewType.customDays)
      out.push(["customDays", 3, "{3}"]);
    out.push([
      "selectedDate",
      selectedDate,
      useToday ? "{new Date()}" : undefined,
    ]);
    if (locale !== "en") out.push(["locale", locale]);
    if (scheme !== "auto") out.push(["colorScheme", scheme]);
    if (weekStartsOn !== "locale")
      out.push(["weekStartsOn", weekStartsOn, `{${weekStartsOn}}`]);
    if (!swipe) out.push(["swipeNavigation", false, "{false}"]);
    if (is12Hour !== "locale")
      out.push(["is12Hour", is12Hour, `{${is12Hour}}`]);
    if (isLoading) out.push(["isLoading", true]);
    if (maxEvents !== undefined)
      out.push(["maxEvents", maxEvents, `{${maxEvents}}`]);
    if (!showAllDayRow) out.push(["showAllDayRow", false, "{false}"]);
    if (slotPressMode !== "press") out.push(["slotPressMode", slotPressMode]);
    out.push(["selectable", true], ["creatable", true]);
    if (stateTheme) out.push(["theme", STATE_THEME]);
    if (sample[1]) out.push(["styles", sample[1], `{${sample[2]}}`]);
    if (palettePrimary) out.push(["palette", palettePrimary]);
    return toJsx(out);
  };

  const panel = (
    <View
      style={[
        wide ? s.sidePanel : s.panel,
        {
          backgroundColor: c.surfaceRaised,
          borderColor: c.border,
          paddingBottom: wide ? 0 : BOTTOM_INSET ? 8 : 0,
        },
      ]}
    >
      {!wide && <View style={[s.grabber, { backgroundColor: c.border }]} />}
      <View accessibilityRole="tablist" style={s.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            testID={`playground-tab-${t.toLowerCase()}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: t === tab }}
            onPress={() => setTab(t)}
            style={[
              s.tab,
              { backgroundColor: t === tab ? c.primary : c.bgMuted },
            ]}
          >
            <Text
              style={[
                s.tabText,
                { color: t === tab ? c.onPrimary : c.textPrimary },
                t === tab && s.bold,
              ]}
            >
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        style={wide ? s.fill : s.controls}
        contentContainerStyle={s.controlsContent}
      >
        {tab === "View" && (
          <>
            <Choice
              label="View"
              options={VIEWS}
              value={view}
              onChange={setView}
            />
            <Choice
              label="Date"
              options={[
                [false, "22 Oct 2026"],
                [true, "Today"],
              ]}
              value={useToday}
              onChange={setUseToday}
            />
            <Choice
              label="Week starts on"
              options={WEEK_STARTS}
              value={weekStartsOn}
              onChange={setWeekStartsOn}
            />
            <Toggle
              label="Swipe navigation"
              value={swipe}
              onChange={setSwipe}
            />
          </>
        )}
        {tab === "Look" && (
          <>
            <Choice
              label="Scheme"
              options={SCHEMES}
              value={scheme}
              onChange={setScheme}
            />
            <Row label="Primary colour">
              {PRIMARIES.map((color, i) => (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityLabel={
                    i === 0 ? "Default primary" : `Primary ${color}`
                  }
                  accessibilityState={{ selected: color === primary }}
                  onPress={() => setPrimary(color)}
                  style={[
                    s.swatchTarget,
                    color === primary && {
                      borderColor: c.textPrimary,
                    },
                  ]}
                >
                  <View style={[s.swatch, { backgroundColor: color }]} />
                </Pressable>
              ))}
            </Row>
            <Toggle
              label="Theme state colours"
              value={stateTheme}
              onChange={setStateTheme}
            />
            <Choice
              label="Styles"
              options={STYLE_SAMPLES.map(([name], i) => [i, name] as const)}
              value={styleSample}
              onChange={setStyleSample}
            />
          </>
        )}
        {tab === "Locale" && (
          <>
            <Choice
              label="Locale (ar and he are RTL)"
              options={LOCALES.map((l) => [l, l] as const)}
              value={locale}
              onChange={setLocale}
            />
            <Choice
              label="Clock"
              options={[
                ["locale", "Locale"],
                [true, "12 h"],
                [false, "24 h"],
              ]}
              value={is12Hour}
              onChange={setIs12Hour}
            />
          </>
        )}
        {tab === "Data" && (
          <>
            <Choice<DataSet | null>
              label="Sample data"
              options={[
                ["none", "0"],
                ["sample", `${OCT_2026_EVENTS.length}`],
                ["1k", "1,000"],
              ]}
              value={typeof data === "number" ? null : data}
              onChange={(v) => v && setData(v)}
            />
            <Choice
              label="Web fixtures"
              options={fixtureList.map((f, i) => [i, f.name] as const)}
              value={fixtureIndex}
              onChange={setData}
            />
            <Toggle label="Loading" value={isLoading} onChange={setIsLoading} />
            <Choice
              label="maxEvents"
              options={[
                [undefined, "Auto"],
                [1, "1"],
                [2, "2"],
                [3, "3"],
              ]}
              value={maxEvents}
              onChange={setMaxEvents}
            />
            <Toggle
              label="showAllDayRow"
              value={showAllDayRow}
              onChange={setShowAllDayRow}
            />
            <Choice
              label="slotPressMode"
              options={[
                ["press", "press"],
                ["longPress", "longPress"],
              ]}
              value={slotPressMode}
              onChange={setSlotPressMode}
            />
          </>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={[s.fill, { backgroundColor: c.bg }]}>
      <View
        style={[
          s.header,
          {
            borderBottomColor: c.border,
            paddingTop: wide ? 16 : TOP_INSET + 4,
          },
        ]}
      >
        <Text
          accessibilityRole="header"
          style={[s.title, { color: c.textPrimary }]}
        >
          Playground
        </Text>
        <LinkButton label="Copy code" onPress={() => setCode(jsx())} />
      </View>
      <View style={wide ? s.wideBody : s.fill}>
        <View style={s.fill}>
          <Text
            style={[s.log, { color: c.textSecondary }]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {log || " "}
          </Text>
          <View testID="playground-calendar" style={s.fill}>
            <Calendar {...props} />
          </View>
        </View>
        {panel}
      </View>
      <CodeModal
        code={code}
        title="Playground JSX"
        onClose={() => setCode(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  bold: { fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 20, fontWeight: "700" },
  wideBody: { flex: 1, flexDirection: "row" },
  log: { paddingHorizontal: 12, paddingVertical: 4, fontSize: 12 },
  panel: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  sidePanel: {
    width: 360,
    borderLeftWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: "center" },
  tabs: { flexDirection: "row", gap: 6 },
  tab: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: "center",
  },
  tabText: { fontSize: 13 },
  controls: { maxHeight: 200 },
  controlsContent: { gap: 10, paddingBottom: 12 },
  row: { gap: 6 },
  label: { fontSize: 14 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  toggleRow: {
    minHeight: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: "center",
  },
  trackOn: { alignItems: "flex-end" },
  knob: { width: 20, height: 20, borderRadius: 10 },
  swatchTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: { width: 30, height: 30, borderRadius: 15 },
});
