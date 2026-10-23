import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
    <View style={styles.container}>
      <Text style={styles.title}>calendar-simple-native examples</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "600" },
  fill: { flex: 1, paddingTop: 60 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  darkText: { color: "#e5e7eb" },
  button: { padding: 12, borderWidth: 1, borderRadius: 6, alignSelf: "center" },
});
