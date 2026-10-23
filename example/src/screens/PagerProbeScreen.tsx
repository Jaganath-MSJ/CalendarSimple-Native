import { useCallback, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { DateTime } from "luxon";
// Internal component: the probe checks re-centring with visible page content.
import { PeriodPager } from "../../../src/components/navigation/PeriodPager";

/** Swipe ten times each way; the title must never jump after re-centring. */
export default function PagerProbeScreen() {
  const { width } = useWindowDimensions();
  const [month, setMonth] = useState(() => DateTime.local().startOf("month"));
  const renderPage = useCallback(
    (offset: -1 | 0 | 1) => (
      <View style={styles.page}>
        <Text style={styles.title}>
          {month.plus({ months: offset }).toFormat("LLLL yyyy")}
        </Text>
      </View>
    ),
    [month],
  );
  const onPage = useCallback(
    (direction: 1 | -1) => setMonth((m) => m.plus({ months: direction })),
    [],
  );
  return (
    <View style={styles.root}>
      <PeriodPager
        enabled
        width={width}
        testID="probe"
        renderPage={renderPage}
        onPage={onPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "600" },
});
