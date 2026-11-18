import { StyleSheet, View } from "react-native";
import Calendar from "../../../src";
import { DEMO_DATE, DEMO_EVENTS } from "../fixtures/demoEvents";
import { useExampleScheme } from "../launch";

/** Month view with the demo data (the prototype October 2026 set plus generated weeks). */
export default function MonthScreen() {
  const scheme = useExampleScheme();
  return (
    <View style={styles.root}>
      <Calendar
        colorScheme={scheme}
        events={DEMO_EVENTS}
        selectedDate={DEMO_DATE}
        creatable
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
