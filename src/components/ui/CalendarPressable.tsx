/**
 * @file `Pressable` with the platform press details of TDD §11: Android
 * ripple, and on web a hover tint and a 2 px focus ring.
 */
import type { ComponentRef, Ref } from "react";
import {
  Platform,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useCalendarTheme } from "../../theme";

/** react-native-web adds `hovered` and `focused` to the style callback state. */
type PressState = PressableStateCallbackType & {
  hovered?: boolean;
  focused?: boolean;
};

export type CalendarPressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle> | ((state: PressState) => StyleProp<ViewStyle>);
  /**
   * `"tint"` (neutral controls): web hover background `bgMuted` and focus
   * ring. `"ring"` (coloured events): focus ring only, so the event colour
   * stays.
   */
  feedback?: "tint" | "ring";
  ref?: Ref<ComponentRef<typeof Pressable>>;
};

const isWeb = Platform.OS === "web";

export function CalendarPressable({
  style,
  feedback = "tint",
  ...rest
}: CalendarPressableProps) {
  const { palette } = useCalendarTheme();
  return (
    <Pressable
      android_ripple={
        Platform.OS === "android" ? { color: palette.bgMuted } : undefined
      }
      {...rest}
      style={(state: PressState) => {
        const own = typeof style === "function" ? style(state) : style;
        if (!isWeb) return own;
        return [
          own,
          feedback === "tint" &&
            state.hovered && { backgroundColor: palette.bgMuted },
          state.focused && {
            outlineWidth: 2,
            outlineStyle: "solid",
            outlineColor: palette.focus,
          },
        ];
      }}
    />
  );
}
