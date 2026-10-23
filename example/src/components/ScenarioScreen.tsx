/**
 * @file A screen that lists named scenarios (one per web story) and renders
 * the selected one. Callbacks write to a log line instead of `alert`.
 */
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Calendar, { type CalendarProps } from "../../../src";
import { useExampleScheme } from "../launch";
import { useChrome } from "../ui/chrome";

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
  const c = useChrome();
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
            style={[
              styles.tab,
              { borderColor: c.border },
              i === index && {
                backgroundColor: c.primary,
                borderColor: c.primary,
              },
            ]}
          >
            <Text style={{ color: i === index ? c.onPrimary : c.textPrimary }}>
              {s.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[styles.log, { color: c.textSecondary }]} numberOfLines={2}>
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
  tabsContent: { gap: 8, padding: 8 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
  },
  log: { paddingHorizontal: 12, paddingVertical: 4 },
  calendar: { flex: 1 },
});
