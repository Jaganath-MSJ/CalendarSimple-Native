/**
 * @file The Showcase home (views grid + feature list) and the Developer list.
 */
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { inGroup } from "./catalog";
import {
  Eyebrow,
  Group,
  ListRow,
  Pill,
  TOP_INSET,
  useChrome,
  useWide,
} from "./chrome";

type Open = (key: string) => void;

const TINTS = ["#22c55e", "#f97316", "#8b5cf6"];

function Preview({ kind }: { kind: string }) {
  const c = useChrome();
  const bar = (color: string, style: object, i: number) => (
    <View
      key={i}
      style={[{ backgroundColor: color, opacity: 0.6, borderRadius: 3 }, style]}
    />
  );
  let body: ReactNode;
  if (kind === "month") {
    const filled: Record<number, string> = {
      0: c.primary,
      2: TINTS[0]!,
      5: TINTS[1]!,
      8: TINTS[2]!,
      11: c.primary,
    };
    body = (
      <View style={p.monthGrid}>
        {Array.from({ length: 14 }, (_, i) => (
          <View
            key={i}
            style={[
              p.monthCell,
              { backgroundColor: filled[i] ?? "transparent" },
              filled[i] ? { opacity: 0.6 } : null,
            ]}
          />
        ))}
      </View>
    );
  } else if (kind === "week") {
    body = (
      <View style={p.row}>
        {bar(c.primary, { flex: 1, height: 30, marginTop: 8 }, 0)}
        {bar(TINTS[0]!, { flex: 1, height: 20, marginTop: 22 }, 1)}
        {bar(TINTS[2]!, { flex: 1, height: 40 }, 2)}
      </View>
    );
  } else if (kind === "day") {
    body = (
      <View style={p.col}>
        {bar(c.primary, { height: 14, width: "70%" }, 0)}
        {bar(TINTS[1]!, { height: 22, width: "85%" }, 1)}
      </View>
    );
  } else {
    body = (
      <View style={[p.col, { gap: 6, paddingTop: 2 }]}>
        {["80%", "60%", "70%"].map((w, i) =>
          bar(c.textSecondary, { height: 8, width: w, opacity: 0.35 }, i),
        )}
      </View>
    );
  }
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[p.preview, { backgroundColor: c.bgMuted }]}
    >
      {body}
    </View>
  );
}

function Card({
  title,
  description,
  kind,
  onPress,
  children,
}: {
  title: string;
  description: string;
  kind: string;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const c = useChrome();
  const content = (
    <>
      <Preview kind={kind} />
      <Text style={[p.cardTitle, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[p.cardText, { color: c.textSecondary }]} numberOfLines={1}>
        {description}
      </Text>
      {children}
    </>
  );
  const box = [
    p.card,
    { backgroundColor: c.surfaceRaised, borderColor: c.border },
  ];
  return onPress ? (
    <Pressable
      testID={`showcase-card-${kind}`}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [box, pressed && { opacity: 0.7 }]}
    >
      {content}
    </Pressable>
  ) : (
    <View testID={`showcase-card-${kind}`} style={box}>
      {content}
    </View>
  );
}

export function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const c = useChrome();
  const wide = useWide();
  return (
    <View
      style={[
        p.header,
        wide
          ? p.headerWide
          : {
              paddingTop: TOP_INSET + 8,
              backgroundColor: c.surfaceRaised,
              borderBottomColor: c.border,
              borderBottomWidth: StyleSheet.hairlineWidth,
            },
      ]}
    >
      <Eyebrow>CALENDAR SIMPLE</Eyebrow>
      <Text
        accessibilityRole="header"
        style={[p.title, { color: c.textPrimary }]}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={[p.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function List({
  group,
  onOpen,
}: {
  group: Parameters<typeof inGroup>[0];
  onOpen: Open;
}) {
  const items = inGroup(group);
  return (
    <Group>
      {items.map((e, i) => (
        <ListRow
          key={e.key}
          title={e.title}
          description={e.description}
          last={i === items.length - 1}
          onPress={() => onOpen(e.key)}
        />
      ))}
    </Group>
  );
}

export function ShowcaseHome({ onOpen }: { onOpen: Open }) {
  const c = useChrome();
  return (
    <View style={[p.fill, { backgroundColor: c.bgMuted }]}>
      <Header
        title="Showcase"
        subtitle="React Native calendar for iOS, Android and web"
      />
      <ScrollView
        testID="example-menu"
        contentContainerStyle={p.content}
        style={p.fill}
      >
        <Eyebrow>VIEWS</Eyebrow>
        <View style={p.grid}>
          <Card
            kind="month"
            title="Month"
            description="Bars, +N more, day sheet"
            onPress={() => onOpen("month")}
          />
          <Card
            kind="week"
            title="Week"
            description="Time grid, all-day row"
            onPress={() => onOpen("week")}
          />
        </View>
        <View style={p.grid}>
          <Card
            kind="day"
            title="Day & 3 Days"
            description="Now-line, overlaps"
          >
            <View style={p.chips}>
              <Pill label="Day" onPress={() => onOpen("day")} />
              <Pill label="3 Days" onPress={() => onOpen("customDays")} />
            </View>
          </Card>
          <Card
            kind="schedule"
            title="Schedule"
            description="Agenda, pull to refresh"
            onPress={() => onOpen("schedule")}
          />
        </View>
        <View style={p.section}>
          <Eyebrow>FEATURES</Eyebrow>
        </View>
        <List group="features" onOpen={onOpen} />
        <View style={p.section}>
          <Eyebrow>MORE FROM THE WEB STORIES</Eyebrow>
        </View>
        <List group="stories" onOpen={onOpen} />
      </ScrollView>
    </View>
  );
}

export function DeveloperHome({ onOpen }: { onOpen: Open }) {
  const c = useChrome();
  return (
    <View style={[p.fill, { backgroundColor: c.bgMuted }]}>
      <Header
        title="Developer"
        subtitle="Engine checks, probes and QA screens"
      />
      <ScrollView contentContainerStyle={p.content} style={p.fill}>
        <Eyebrow>TOOLS AND QA</Eyebrow>
        <List group="developer" onOpen={onOpen} />
      </ScrollView>
    </View>
  );
}

const p = StyleSheet.create({
  fill: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 2 },
  headerWide: { paddingTop: 24, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 2 },
  content: { padding: 16, gap: 12, maxWidth: 760, width: "100%" },
  section: { marginTop: 6 },
  grid: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
    minHeight: 48,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", marginTop: 2 },
  cardText: { fontSize: 12 },
  chips: { flexDirection: "row", gap: 6, marginTop: 4 },
  preview: { height: 64, borderRadius: 8, padding: 6, overflow: "hidden" },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 2, flex: 1 },
  monthCell: { width: "12.4%", height: 23, borderRadius: 2 },
  row: { flexDirection: "row", gap: 3, alignItems: "flex-start" },
  col: { gap: 4 },
});
