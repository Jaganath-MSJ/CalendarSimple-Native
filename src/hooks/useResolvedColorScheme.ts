/**
 * @file Resolves `colorScheme` against the OS setting (TDD §8.1 step 3).
 */
import { useColorScheme } from "react-native";
import type { ColorScheme } from "../core";

/** `"auto"` follows the OS; anything other than `"dark"` is light. */
export function useResolvedColorScheme(pref: ColorScheme): "light" | "dark" {
  const os = useColorScheme();
  return (pref === "auto" ? os : pref) === "dark" ? "dark" : "light";
}
