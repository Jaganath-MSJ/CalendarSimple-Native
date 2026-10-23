/**
 * @file A screen that lists named scenarios (one per web story) and renders
 * the selected one. Callbacks write to a log line instead of `alert`.
 */
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Calendar, { type CalendarProps } from "../../../src";
import { useExampleScheme } from "../launch";

export type Log = (message: string) => void;

export interface Scenario {
  /** The web story name. */
  name: string;
  props: (log: Log) => CalendarProps;
  /** Custom render (compound components); defaults to `<Calendar {...props} />`. */
  render?: (props: CalendarProps) => ReactNode;
}

export default function ScenarioScreen({
  scenarios,
}: {
  scenarios: Scenario[];
}) {
  const scheme = useExampleScheme();
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const scenario = scenarios[index] ?? scenarios[0];
  if (!scenario) return null;
  const props: CalendarProps = {
    colorScheme: scheme,
    ...scenario.props(setMessage),
  };

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {scenarios.map((s, i) => (
          <Pressable
            key={s.name}
            accessibilityRole="button"
            accessibilityState={{ selected: i === index }}
            onPress={() => {
              setIndex(i);
              setMessage("");
            }}
            style={[styles.tab, i === index && styles.tabSelected]}
          >
            <Text style={i === index && styles.tabSelectedText}>{s.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.log} numberOfLines={2}>
        {message || " "}
      </Text>
      <View key={scenario.name} style={styles.calendar}>
        {scenario.render ? scenario.render(props) : <Calendar {...props} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: { flexGrow: 0 },
  tabsContent: { gap: 8, paddingHorizontal: 8 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 6,
  },
  tabSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabSelectedText: { color: "#ffffff" },
  log: { paddingHorizontal: 8, paddingVertical: 4, color: "#6b7280" },
  calendar: { flex: 1 },
});
