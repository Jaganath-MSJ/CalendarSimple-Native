import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SCREENS } from "./screens";
import { forcedScheme, initialScreen, SchemeContext } from "./launch";

const SCHEME = forcedScheme();
/** The dark palette background (TDD §10.1). */
const DARK_BG = "#111827";

export default function App() {
  const [selected, setSelected] = useState<string | null>(initialScreen);
  const screen = SCREENS.find((s) => s.key === selected);

  if (screen) {
    const Screen = screen.component;
    return (
      <SchemeContext.Provider value={SCHEME}>
        <View
          style={[
            styles.fill,
            SCHEME === "dark" && { backgroundColor: DARK_BG },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(null)}
            style={styles.button}
          >
            <Text style={SCHEME === "dark" && styles.darkText}>Back</Text>
          </Pressable>
          <Screen />
        </View>
      </SchemeContext.Provider>
    );
  }

  return (
    <View style={styles.fill}>
      {/* The title stays put; only the menu scrolls (it is taller than a phone). */}
      <Text style={styles.title}>calendar-simple-native examples</Text>
      <ScrollView
        testID="example-menu"
        contentContainerStyle={styles.container}
      >
        {SCREENS.map((s) => (
          <Pressable
            key={s.key}
            accessibilityRole="button"
            onPress={() => setSelected(s.key)}
            style={styles.button}
          >
            <Text>{s.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    paddingBottom: 12,
  },
  fill: { flex: 1, paddingTop: 60 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 24,
  },
  darkText: { color: "#e5e7eb" },
  button: { padding: 12, borderWidth: 1, borderRadius: 6, alignSelf: "center" },
});
