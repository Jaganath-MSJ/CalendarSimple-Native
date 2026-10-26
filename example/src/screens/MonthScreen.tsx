import { StyleSheet, View } from "react-native";
import Calendar from "../../../src";
import { OCT_2026_EVENTS } from "../../../src/core/test/fixtures";
import { useExampleScheme } from "../launch";

/** Month view with the prototype October 2026 data set. */
export default function MonthScreen() {
  const scheme = useExampleScheme();
  return (
    <View style={styles.root}>
      <Calendar
        colorScheme={scheme}
        events={OCT_2026_EVENTS}
        selectedDate={new Date(2026, 9, 22)}
        creatable
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
