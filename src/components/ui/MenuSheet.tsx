/**
 * @file Option list in a bottom sheet (phone and compact pickers).
 */
import { useRef, type ComponentRef } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useCalendarTheme } from "../../theme";
import { MenuOptionRow, type MenuOption } from "./MenuOption";
import { Sheet } from "./Sheet";

export type { MenuOption } from "./MenuOption";

export interface MenuSheetProps<V> {
  visible: boolean;
  title: string;
  options: MenuOption<V>[];
  onSelect: (value: V) => void;
  onClose: () => void;
  /** Sheet test ID, e.g. `calendar-menu-view`. */
  testID: string;
}

export function MenuSheet<V extends string | number>({
  visible,
  title,
  options,
  onSelect,
  onClose,
  testID,
}: MenuSheetProps<V>) {
  const { palette, metrics } = useCalendarTheme();
  const { config, testId } = useCalendarConfig();
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.selected),
  );
  const rowHeight = Math.max(metrics.sheet.rowHeight, metrics.touchTarget);
  // `contentOffset` is iOS-only; scroll once the rows are laid out instead,
  // so the selected option (e.g. the year) is in view on Android too.
  const listRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrolled = useRef(false);
  const scrollToSelected = () => {
    if (scrolled.current) return;
    scrolled.current = true;
    listRef.current?.scrollTo({
      x: 0,
      y: Math.max(0, selectedIndex - 2) * rowHeight,
      animated: false,
    });
  };
  return (
    <Sheet visible={visible} onClose={onClose} testID={testID} label={title}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={config.maxFontSizeMultiplier}
        style={[styles.title, { color: palette.textSecondary }]}
      >
        {title}
      </Text>
      <ScrollView
        accessibilityRole="menu"
        ref={listRef}
        testID={`${testID}-list`}
        onContentSizeChange={scrollToSelected}
        style={config.styles.menu}
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 13, paddingHorizontal: 16, paddingBottom: 8 },
});
