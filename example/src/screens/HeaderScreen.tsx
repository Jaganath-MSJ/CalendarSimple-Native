import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Calendar from "../../../src";

/** The default header: Today, ‹ ›, title and the view, month and year pickers. */
export default function HeaderScreen() {
  const [log, setLog] = useState("Tap a header control");
  return (
    <View style={styles.root}>
      <Text style={styles.log}>{log}</Text>
      <Calendar
        customDays={3}
        showWeekNumbers
        onNavigate={(d) => setLog(`onNavigate ${d.toDateString()}`)}
        onViewChange={(v) => setLog(`onViewChange ${v}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  log: { padding: 8, fontSize: 12 },
});
