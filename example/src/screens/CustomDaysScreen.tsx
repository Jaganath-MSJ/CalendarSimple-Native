import { StyleSheet, View } from "react-native";
import Calendar from "../../../src";
import { DEMO_DATE, DEMO_EVENTS } from "../fixtures/demoEvents";
import { useExampleScheme } from "../launch";

/** Custom Days view (3 days) with the demo data (the prototype October 2026 set plus generated weeks). */
export default function CustomDaysScreen() {
  const scheme = useExampleScheme();
  return (
    <View style={styles.root}>
      <Calendar
        colorScheme={scheme}
        view="customDays"
        customDays={3}
        events={DEMO_EVENTS}
        selectedDate={DEMO_DATE}
        showCurrentTime
        autoScrollToCurrentTime
        creatable
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
