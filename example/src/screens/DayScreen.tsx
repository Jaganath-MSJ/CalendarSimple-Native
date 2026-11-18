import { StyleSheet, View } from "react-native";
import Calendar from "../../../src";
import { DEMO_DATE, DEMO_EVENTS } from "../fixtures/demoEvents";
import { useExampleScheme } from "../launch";

/** Day view with the demo data (the prototype October 2026 set plus generated weeks). */
export default function DayScreen() {
  const scheme = useExampleScheme();
  return (
    <View style={styles.root}>
      <Calendar
        colorScheme={scheme}
        view="day"
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
