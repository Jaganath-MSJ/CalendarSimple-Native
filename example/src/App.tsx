/**
 * @file The example app shell. Phones: a bottom tab bar (Showcase,
 * Playground, Developer) and a title bar over each demo. Web at 768 wide or
 * more: a left sidebar (SHOWCASE / TRY / DEVELOPER) and a page header.
 */
import { useEffect, useState } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ECalendarViewType } from "../../src";
import { SCREENS } from "./screens";
import { forcedScheme, initialScreen, SchemeContext } from "./launch";
import PlaygroundScreen from "./screens/PlaygroundScreen";
import { entry, ENTRIES, inGroup, type Entry } from "./ui/catalog";
import {
  BOTTOM_INSET,
  CodeModal,
  LinkButton,
  OutlineButton,
  TOP_INSET,
  useChrome,
  useWide,
} from "./ui/chrome";
import { DeveloperHome, ShowcaseHome } from "./ui/Home";

const SCHEME = forcedScheme();

type Tab = "showcase" | "playground" | "developer";
const TABS: [Tab, string, string][] = [
  ["showcase", "Showcase", "▦"],
  ["playground", "Playground", "≡"],
  ["developer", "Developer", "</>"],
];

function initialState(): { tab: Tab; demo: string | null } {
  const key = initialScreen();
  if (key === "playground") return { tab: "playground", demo: null };
  if (!key || !SCREENS.some((s) => s.key === key))
    return { tab: "showcase", demo: null };
  return {
    tab: entry(key)?.group === "developer" ? "developer" : "showcase",
    demo: key,
  };
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const c = useChrome();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        a.tabBar,
        {
          backgroundColor: c.surfaceRaised,
          borderTopColor: c.border,
          paddingBottom: BOTTOM_INSET || 4,
        },
      ]}
    >
      {TABS.map(([key, label, glyph]) => {
        const on = key === tab;
        const color = on ? c.primary : c.textSecondary;
        return (
          <Pressable
            key={key}
            testID={`tab-${key}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(key)}
            style={a.tabItem}
          >
            <Text style={[a.tabGlyph, { color }]}>{glyph}</Text>
            <Text style={[a.tabLabel, { color }, on && a.bold]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Sidebar({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (key: string) => void;
}) {
  const c = useChrome();
  const item = (key: string, title: string) => {
    const on = key === current;
    return (
      <Pressable
        key={key}
        testID={`nav-${key}`}
        accessibilityRole="link"
        accessibilityState={{ selected: on }}
        onPress={() => onSelect(key)}
        style={[a.navItem, on && { backgroundColor: c.bgMuted }]}
      >
        <Text
          style={[
            a.navText,
            { color: on ? c.primary : c.textPrimary },
            on && a.bold,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    );
  };
  const section = (label: string) => (
    <Text
      key={label}
      accessibilityRole="header"
      style={[a.navSection, { color: c.textSecondary }]}
    >
      {label}
    </Text>
  );
  return (
    <ScrollView
      accessibilityRole="menu"
      style={[
        a.sidebar,
        { backgroundColor: c.surfaceRaised, borderRightColor: c.border },
      ]}
      contentContainerStyle={a.sidebarContent}
    >
      <Text style={[a.brand, { color: c.textPrimary }]}>Calendar Simple</Text>
      {section("SHOWCASE")}
      {item("home", "Overview")}
      {[...inGroup("views"), ...inGroup("features"), ...inGroup("stories")].map(
        (e) => item(e.key, e.title),
      )}
      {section("TRY")}
      {item("playground", "Playground")}
      {section("DEVELOPER")}
      {inGroup("developer").map((e) => item(e.key, e.title))}
    </ScrollView>
  );
}

/** A demo screen under its title bar (phone) or page header (web). */
function DemoPage({
  item,
  onBack,
  onPlayground,
}: {
  item: Entry;
  onBack: () => void;
  onPlayground: () => void;
}) {
  const c = useChrome();
  const wide = useWide();
  const [code, setCode] = useState<string | null>(null);
  const Screen = SCREENS.find((s) => s.key === item.key)?.component;
  if (!Screen) return null;

  return (
    <View style={[a.fill, { backgroundColor: wide ? c.bgMuted : c.bg }]}>
      {wide ? (
        <View style={a.pageHeader}>
          <View style={a.fill}>
            <Text
              accessibilityRole="header"
              style={[a.pageTitle, { color: c.textPrimary }]}
            >
              {item.title}
            </Text>
            <Text style={[a.pageText, { color: c.textSecondary }]}>
              {item.description}
            </Text>
          </View>
          <View style={a.actions}>
            <OutlineButton
              label="View code"
              onPress={() => setCode(item.code)}
            />
            <OutlineButton label="Open in Playground" onPress={onPlayground} />
          </View>
        </View>
      ) : (
        <View
          style={[
            a.titleBar,
            { paddingTop: TOP_INSET, borderBottomColor: c.border },
          ]}
        >
          <LinkButton label="Back" onPress={onBack}>
            <Text style={[a.backGlyph, { color: c.primary }]}>‹</Text>
          </LinkButton>
          <View style={a.titleText}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              style={[a.barTitle, { color: c.textPrimary }]}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[a.barText, { color: c.textSecondary }]}
            >
              {item.description}
            </Text>
          </View>
          <LinkButton label="Code" onPress={() => setCode(item.code)} />
        </View>
      )}
      <View
        style={[
          a.fill,
          wide && [
            a.pageCard,
            { backgroundColor: c.bg, borderColor: c.border },
          ],
        ]}
      >
        <Screen />
      </View>
      <CodeModal
        code={code}
        title={`${item.title} code`}
        onClose={() => setCode(null)}
      />
    </View>
  );
}

export default function App() {
  const c = useChrome();
  const wide = useWide();
  const [{ tab, demo }, setState] = useState(initialState);
  const [playView, setPlayView] = useState<ECalendarViewType>(
    ECalendarViewType.month,
  );
  const item = entry(demo);

  const open = (key: string) => setState((st) => ({ ...st, demo: key }));
  const back = () => setState((st) => ({ ...st, demo: null }));
  const toPlayground = (view?: ECalendarViewType) => {
    setPlayView(view ?? ECalendarViewType.month);
    setState({ tab: "playground", demo: null });
  };

  useEffect(() => {
    if (!demo) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [demo]);

  const page =
    tab === "playground" ? (
      <PlaygroundScreen key={playView} initialView={playView} />
    ) : item ? (
      <DemoPage
        item={item}
        onBack={back}
        onPlayground={() => toPlayground(item.view)}
      />
    ) : tab === "developer" ? (
      <DeveloperHome onOpen={open} />
    ) : (
      <ShowcaseHome onOpen={open} />
    );

  return (
    <SchemeContext.Provider value={SCHEME}>
      <StatusBar style={c.dark ? "light" : "dark"} />
      {wide ? (
        <View style={[a.fill, a.wide, { backgroundColor: c.bgMuted }]}>
          <Sidebar
            current={tab === "playground" ? "playground" : (demo ?? "home")}
            onSelect={(key) => {
              if (key === "playground") toPlayground();
              else if (key === "home")
                setState({ tab: "showcase", demo: null });
              else
                setState({
                  tab:
                    entry(key)?.group === "developer"
                      ? "developer"
                      : "showcase",
                  demo: key,
                });
            }}
          />
          <View style={a.fill}>{page}</View>
        </View>
      ) : (
        <View style={[a.fill, { backgroundColor: c.bg }]}>
          <View style={a.fill}>{page}</View>
          {!item && (
            <TabBar
              tab={tab}
              onChange={(t) => setState({ tab: t, demo: null })}
            />
          )}
        </View>
      )}
    </SchemeContext.Provider>
  );
}

// Every catalogue key must be a real screen.
if (__DEV__)
  for (const e of ENTRIES)
    if (!SCREENS.some((s) => s.key === e.key))
      console.warn(`catalog: unknown screen ${e.key}`);

const a = StyleSheet.create({
  fill: { flex: 1 },
  bold: { fontWeight: "600" },
  wide: { flexDirection: "row" },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabGlyph: { fontSize: 18, lineHeight: 22, fontWeight: "600" },
  tabLabel: { fontSize: 11 },
  sidebar: { width: 240, flexGrow: 0, borderRightWidth: 1 },
  sidebarContent: { padding: 16, paddingTop: 24, gap: 2 },
  brand: { fontSize: 18, fontWeight: "700", marginBottom: 12, marginLeft: 8 },
  navSection: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 16,
    marginBottom: 4,
    marginHorizontal: 8,
  },
  navItem: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  navText: { fontSize: 14 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 24,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: "700" },
  pageText: { fontSize: 14, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8 },
  pageCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
    paddingTop: 8,
  },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backGlyph: { fontSize: 26, lineHeight: 28, marginTop: -2 },
  titleText: { flex: 1, alignItems: "center" },
  barTitle: { fontSize: 16, fontWeight: "700" },
  barText: { fontSize: 11 },
});
