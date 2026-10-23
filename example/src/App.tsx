import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SCREENS } from "./screens";

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const screen = SCREENS.find((s) => s.key === selected);

  if (screen) {
    const Screen = screen.component;
    return (
      <View style={styles.fill}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelected(null)}
          style={styles.button}
        >
          <Text>Back</Text>
        </Pressable>
        <Screen />
      </View>
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
  button: { padding: 12, borderWidth: 1, borderRadius: 6, alignSelf: "center" },
});
