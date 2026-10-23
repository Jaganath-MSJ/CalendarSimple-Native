/**
 * @file Loading overlay (port spec §4.8): blocks input on a view that already
 * shows events, with no dimming.
 */
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useIsCurrentPage } from "../../context/LayoutContext";

export function LoadingOverlay({ children }: { children: ReactNode }) {
  const current = useIsCurrentPage();
  return (
    <View
      testID={current ? "calendar-loading-overlay" : undefined}
      pointerEvents="none"
      accessibilityState={{ busy: true }}
      style={styles.fill}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
