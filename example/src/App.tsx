import { Text, View, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>calendar-simple-native examples</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "600" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
