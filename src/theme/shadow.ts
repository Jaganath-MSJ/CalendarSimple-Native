/**
 * @file Raised-surface shadow per platform (TDD §11): iOS `shadow*`,
 * Android `elevation`, web `boxShadow`.
 */
import { Platform, type ViewStyle } from "react-native";

export const RAISED_SHADOW: ViewStyle =
  Platform.select<ViewStyle>({
    android: { elevation: 4 },
    web: { boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)" },
    default: {
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
  }) ?? {};
