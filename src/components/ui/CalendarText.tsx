/**
 * @file `Text` that follows the system font size up to the calendar's
 * `maxFontSizeMultiplier` cap (TDD §10.2). Every calendar label uses it.
 */
import { Text, type TextProps } from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";

export function CalendarText(props: TextProps) {
  const { config } = useCalendarConfig();
  return (
    <Text
      {...props}
      allowFontScaling
      maxFontSizeMultiplier={config.maxFontSizeMultiplier}
    />
  );
}
