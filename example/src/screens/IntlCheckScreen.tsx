import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  probeDigits,
  probeHourCycle,
  probeMeridiem,
  probeMonthsLong,
  probeWeekdaysShort,
  probeWeekStart,
} from "../intl/probes";

type Row = { label: string; value: string; expected: string };

function rows(): Row[] {
  return [
    {
      label: "fr months[0]",
      value: probeMonthsLong("fr")[0] ?? "",
      expected: "janvier",
    },
    {
      label: "ja weekdays short",
      value: `${probeWeekdaysShort("ja").length}: ${probeWeekdaysShort("ja").join(" ")}`,
      expected: "7",
    },
    { label: "ko 13:00", value: probeMeridiem("ko"), expected: "오후" },
    { label: "ar-EG 123", value: probeDigits("ar-EG"), expected: "١٢٣" },
    {
      label: "week start en-US",
      value: String(probeWeekStart("en-US")),
      expected: "0",
    },
    {
      label: "week start en-GB",
      value: String(probeWeekStart("en-GB")),
      expected: "1",
    },
    {
      label: "week start ar-EG",
      value: String(probeWeekStart("ar-EG")),
      expected: "6",
    },
    {
      label: "hour cycle en-US",
      value: String(probeHourCycle("en-US")),
      expected: "h12",
    },
    {
      label: "hour cycle en-GB",
      value: String(probeHourCycle("en-GB")),
      expected: "h23",
    },
  ];
}

export default function IntlCheckScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {rows().map((r) => {
        const ok =
          r.value === r.expected || r.value.startsWith(`${r.expected}:`);
        return (
          <View key={r.label} style={styles.row} testID={`intl-${r.label}`}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>
              {r.value} (expected {r.expected}) {ok ? "OK" : "MISMATCH"}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  row: { gap: 2 },
  label: { fontWeight: "600" },
  value: { fontSize: 14 },
});
