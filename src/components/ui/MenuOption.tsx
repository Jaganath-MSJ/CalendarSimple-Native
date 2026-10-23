/**
 * @file One option row shared by `MenuSheet` and `AnchoredMenu`.
 */
import { Pressable, StyleSheet, Text } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useCalendarTheme } from "../../theme";

export interface MenuOption<V> {
  label: string;
  value: V;
  selected: boolean;
}

export function MenuOptionRow<V extends string | number>({
  option,
  onSelect,
  testID,
  height,
}: {
  option: MenuOption<V>;
  onSelect: (value: V) => void;
  testID: string;
  height: number;
}) {
  const { palette } = useCalendarTheme();
  const { config } = useCalendarConfig();
  return (
    <Pressable
      testID={`${testID}-menu-option-${option.value}`}
      onPress={() => onSelect(option.value)}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: option.selected }}
      style={({ pressed }) => [
        styles.row,
        { minHeight: height },
        (pressed || option.selected) && { backgroundColor: palette.bgMuted },
      ]}
    >
      <Text
        maxFontSizeMultiplier={config.maxFontSizeMultiplier}
        style={[
          styles.label,
          { color: option.selected ? palette.primary : palette.textPrimary },
          option.selected && styles.selected,
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: "center", paddingHorizontal: 16 },
  label: { fontSize: 16 },
  selected: { fontWeight: "600" },
});
