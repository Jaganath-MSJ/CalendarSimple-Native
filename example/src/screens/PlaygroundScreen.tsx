/**
 * @file Parity with web `playground/Playground.stories.tsx` (Kitchen Sink):
 * a compact control panel over the main props and the web test fixtures.
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Calendar, {
  ECalendarViewType,
  type CalendarProps,
  type ColorScheme,
} from "../../../src";
import { fixtureList } from "../fixtures/webFixtures";
import { useExampleScheme } from "../launch";

const VIEWS = Object.values(ECalendarViewType);
const LOCALES = ["en", "en-GB", "fr", "de", "ja", "ko", "ar", "he"];
const SCHEMES: ColorScheme[] = ["auto", "light", "dark"];
const FLAGS = [
  "is12Hour",
  "selectable",
  "creatable",
  "showWeekNumbers",
  "showAdjacentMonths",
  "showCurrentTime",
  "autoScrollToCurrentTime",
  "showAllDayRow",
  "swipeNavigation",
  "isLoading",
] as const;
type Flag = (typeof FLAGS)[number];

function next<T>(list: readonly T[], value: T): T {
  return list[(list.indexOf(value) + 1) % list.length] ?? value;
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.chip}>
      <Text>{label}</Text>
    </Pressable>
  );
}

export default function PlaygroundScreen() {
  const launchScheme = useExampleScheme();
  const [view, setView] = useState<ECalendarViewType>(ECalendarViewType.month);
  const [fixture, setFixture] = useState(0);
  const [locale, setLocale] = useState("en");
  const [scheme, setScheme] = useState<ColorScheme>(launchScheme);
  const [flags, setFlags] = useState<Record<Flag, boolean>>({
    is12Hour: false,
    selectable: true,
    creatable: false,
    showWeekNumbers: false,
    showAdjacentMonths: true,
    showCurrentTime: true,
    autoScrollToCurrentTime: false,
    showAllDayRow: true,
    swipeNavigation: true,
    isLoading: false,
  });
  const [log, setLog] = useState("");

  const entry = fixtureList[fixture] ?? fixtureList[0];
  const events = useMemo(() => entry?.fn() ?? [], [entry]);

  const props: CalendarProps = {
    ...flags,
    view,
    events,
    locale,
    colorScheme: scheme,
    customDays: 3,
    onViewChange: setView,
    onEventClick: (e) => setLog(`onEventClick ${e.title}`),
    onDateClick: (d) => setLog(`onDateClick ${d.toDateString()}`),
    onSlotClick: (s, e) =>
      setLog(`onSlotClick ${s.toLocaleString()} – ${e.toLocaleTimeString()}`),
    onDateRangeChange: (s, e, v) =>
      setLog(
        `onDateRangeChange ${v}: ${s.toDateString()} – ${e.toDateString()}`,
      ),
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.panel} contentContainerStyle={styles.wrap}>
        <Chip
          label={`view: ${view}`}
          onPress={() => setView(next(VIEWS, view))}
        />
        <Chip
          label={`events: ${entry?.name}`}
          onPress={() => setFixture((fixture + 1) % fixtureList.length)}
        />
        <Chip
          label={`locale: ${locale}`}
          onPress={() => setLocale(next(LOCALES, locale))}
        />
        <Chip
          label={`scheme: ${scheme}`}
          onPress={() => setScheme(next(SCHEMES, scheme))}
        />
        {FLAGS.map((flag) => (
          <Chip
            key={flag}
            label={`${flag}: ${flags[flag] ? "on" : "off"}`}
            onPress={() => setFlags({ ...flags, [flag]: !flags[flag] })}
          />
        ))}
      </ScrollView>
      <Text style={styles.log} numberOfLines={1}>
        {log || " "}
      </Text>
      <View style={styles.root}>
        <Calendar {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  panel: { flexGrow: 0, maxHeight: 160 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 8 },
  chip: {
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 6,
  },
  log: { paddingHorizontal: 8, color: "#6b7280" },
});
