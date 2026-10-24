/**
 * @file Option list opened below its button (wide pickers).
 */
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { RAISED_SHADOW, useCalendarTheme } from "../../theme";
import { MenuOptionRow, type MenuOption } from "./MenuOption";
import { useReturnFocusOnClose, type FocusAnchor } from "./focusReturn";

export interface MenuAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnchoredMenuProps<V> {
  visible: boolean;
  anchor: MenuAnchor;
  options: MenuOption<V>[];
  onSelect: (value: V) => void;
  onClose: () => void;
  /** Menu test ID, e.g. `calendar-menu-view`. */
  testID: string;
  /** Gets screen-reader focus back when the menu closes. */
  returnFocusTo?: FocusAnchor;
}

const MENU_MIN_WIDTH = 180;
const MENU_MAX_HEIGHT = 320;

export function AnchoredMenu<V extends string | number>({
  visible,
  anchor,
  options,
  onSelect,
  onClose,
  testID,
  returnFocusTo,
}: AnchoredMenuProps<V>) {
  const { palette, metrics } = useCalendarTheme();
  const { config, testId } = useCalendarConfig();
  const window = useWindowDimensions();
  useReturnFocusOnClose(visible, returnFocusTo);
  if (!visible) return null;
  const width = Math.max(anchor.width, MENU_MIN_WIDTH);
  const left = Math.max(0, Math.min(anchor.x, window.width - width));
  const rowHeight = metrics.touchTarget;
  return (
    <Modal visible transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel={config.messages.close}
      />
      <ScrollView
        testID={testID}
        accessibilityRole="menu"
        accessibilityViewIsModal
        style={[
          styles.menu,
          {
            top: anchor.y + anchor.height + 4,
            left,
            width,
            maxHeight: MENU_MAX_HEIGHT,
            backgroundColor: palette.surfaceRaised,
            borderColor: palette.border,
          },
          config.styles.menu,
        ]}
      >
        {options.map((o) => (
          <MenuOptionRow
            key={String(o.value)}
            option={o}
            onSelect={onSelect}
            testID={testId}
            height={rowHeight}
          />
        ))}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: "absolute",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    ...RAISED_SHADOW,
  },
});
