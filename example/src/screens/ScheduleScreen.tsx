import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Calendar from "../../../src";
import { DEMO_DATE, DEMO_EVENTS } from "../fixtures/demoEvents";
import { useExampleScheme } from "../launch";

/** Schedule view: pull-to-refresh (1 s) and end reached (logged). */
export default function ScheduleScreen() {
  const scheme = useExampleScheme();
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    timer.current = setTimeout(() => setRefreshing(false), 1000);
  }, []);
  const onEndReached = useCallback(() => {
    console.log("[schedule] end reached");
  }, []);
  return (
    <View style={styles.root}>
      <Calendar
        colorScheme={scheme}
        view="schedule"
        events={DEMO_EVENTS}
        selectedDate={DEMO_DATE}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
