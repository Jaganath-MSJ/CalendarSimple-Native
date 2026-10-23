/**
 * @file Shared bottom-sheet frame: scrim, rounded panel and grabber.
 */
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useCalendarTheme } from "../../theme";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  testID?: string;
  /** Accessibility label of the panel. */
  label: string;
}

/**
 * A bottom sheet in a `Modal`. Tapping the scrim or the Android back button
 * (`onRequestClose`) calls `onClose`. Bottom padding is `safeAreaInsets.bottom`.
 */
export function Sheet({
  visible,
  onClose,
  children,
  testID,
  label,
}: SheetProps) {
  const { palette, metrics } = useCalendarTheme();
  const { config } = useCalendarConfig();
  const { messages } = config;
  if (!visible) return null;
  const { radius, grabberWidth, grabberHeight } = metrics.sheet;
  return (
    <Modal
      testID={testID}
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.scrim }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={messages.close}
        />
        <View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[
            styles.panel,
            {
              backgroundColor: palette.surfaceRaised,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              paddingBottom: config.safeAreaInsets.bottom ?? 0,
            },
          ]}
        >
          <View
            style={[
              styles.grabber,
              {
                width: grabberWidth,
                height: grabberHeight,
                borderRadius: grabberHeight / 2,
                backgroundColor: palette.border,
              },
            ]}
          />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  panel: { maxHeight: "80%", paddingTop: 8 },
  grabber: { alignSelf: "center", marginBottom: 8 },
});
