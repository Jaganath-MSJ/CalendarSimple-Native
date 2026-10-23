import { StyleSheet, View } from "react-native";
import Calendar from "../../../src";
import { OCT_2026_EVENTS } from "../../../src/core/test/fixtures";

/** Custom Days view (3 days) with the prototype October 2026 data set. */
export default function CustomDaysScreen() {
  return (
    <View style={styles.root}>
      <Calendar
        view="customDays"
        customDays={3}
        events={OCT_2026_EVENTS}
        selectedDate={new Date(2026, 9, 22)}
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
