/**
 * @file Shared bottom-sheet frame: scrim, rounded panel and grabber.
 */
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useCalendarTheme } from "../../theme";
import { useReturnFocusOnClose, type FocusAnchor } from "./focusReturn";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Panel test ID; the `Modal` gets `<testID>-modal`. */
  testID?: string;
  /** Accessibility label of the panel. */
  label: string;
  /** Gets screen-reader focus back when the sheet closes. */
  returnFocusTo?: FocusAnchor;
}

/**
 * A bottom sheet in a `Modal`. Tapping the scrim or the Android back button
 * (`onRequestClose`) calls `onClose`. Bottom padding is
 * `safeAreaInsets.bottom`, or 8 when there is no inset.
 */
export function Sheet({
  visible,
  onClose,
  children,
  testID,
  label,
  returnFocusTo,
}: SheetProps) {
  const { palette, metrics } = useCalendarTheme();
  const { config } = useCalendarConfig();
  const { messages } = config;
  useReturnFocusOnClose(visible, returnFocusTo);
  if (!visible) return null;
  const { radius, grabberWidth, grabberHeight } = metrics.sheet;
  return (
    <Modal
      testID={testID && `${testID}-modal`}
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
          testID={testID}
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={[
            styles.panel,
            {
              backgroundColor: palette.surfaceRaised,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              paddingBottom: config.safeAreaInsets.bottom || PANEL_PADDING,
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

/**
 * Panel top padding, and the bottom padding when there is no safe-area
 * inset (TDD §10 gives no sheet padding; this reuses the existing top value).
 */
const PANEL_PADDING = 8;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  panel: { maxHeight: "80%", paddingTop: PANEL_PADDING },
  grabber: { alignSelf: "center", marginBottom: 8 },
});
