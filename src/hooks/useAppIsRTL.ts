/**
 * @file The app-wide RTL flag (TDD §8.1 flip rule input).
 */
import { I18nManager } from "react-native";

/**
 * `I18nManager.isRTL`, read at render so a change (which needs an app reload
 * on device) and tests that set it are both picked up. react-native-web has
 * no `isRTL` property (only `getConstants()`), and `undefined` must not
 * count as a direction: it would flip every web calendar.
 */
export function useAppIsRTL(): boolean {
  const flag = (I18nManager as { isRTL?: boolean }).isRTL;
  return flag ?? I18nManager.getConstants?.().isRTL ?? false;
}
