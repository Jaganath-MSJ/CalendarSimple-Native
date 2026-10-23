/**
 * @file The example app's own chrome: colours come from the library palette
 * (`src/theme/palette.ts`) for the resolved scheme, plus small shared parts.
 */
import type { ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { PALETTE, type CalendarPalette } from "../../../src/theme/palette";
import { useExampleScheme } from "../launch";

export type Chrome = CalendarPalette & { dark: boolean };

/** Palette of the launch scheme (`?scheme=`), else the system scheme. */
export function useChrome(): Chrome {
  const forced = useExampleScheme();
  const system = useColorScheme();
  const dark = forced === "auto" ? system === "dark" : forced === "dark";
  return { ...PALETTE[dark ? "dark" : "light"], dark };
}

/** Web at 768 wide or more uses the sidebar layout. */
export function useWide(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= 768;
}

export const TOP_INSET =
  Platform.OS === "ios"
    ? 54
    : Platform.OS === "android"
      ? (StatusBar.currentHeight ?? 24)
      : 0;
export const BOTTOM_INSET =
  Platform.OS === "ios" ? 28 : Platform.OS === "android" ? 24 : 0;

export function Eyebrow({ children }: { children: string }) {
  const c = useChrome();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.eyebrow, { color: c.textSecondary }]}
    >
      {children}
    </Text>
  );
}

/** A pill button; `selected` fills it with the primary colour. */
export function Pill({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const c = useChrome();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: selected ? c.primary : c.bgMuted },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: selected ? c.onPrimary : c.textPrimary },
          selected && styles.bold,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A bordered button with secondary weight. */
export function OutlineButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const c = useChrome();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.outline,
        { borderColor: c.border, backgroundColor: c.surfaceRaised },
      ]}
    >
      <Text style={[styles.pillText, { color: c.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/** A text button in the primary colour (title bars). */
export function LinkButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children?: ReactNode;
}) {
  const c = useChrome();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={styles.link}
    >
      {children}
      <Text style={[styles.linkText, { color: c.primary }]}>{label}</Text>
    </Pressable>
  );
}

/** A grouped list row with a chevron. */
export function ListRow({
  title,
  description,
  last,
  onPress,
}: {
  title: string;
  description?: string;
  last?: boolean;
  onPress: () => void;
}) {
  const c = useChrome();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
        },
        pressed && { backgroundColor: c.bgMuted },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: c.textPrimary }]}>{title}</Text>
        {description ? (
          <Text
            style={[styles.rowDescription, { color: c.textSecondary }]}
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.chevron, { color: c.textSecondary }]}>›</Text>
    </Pressable>
  );
}

export function Group({ children }: { children: ReactNode }) {
  const c = useChrome();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: c.surfaceRaised, borderColor: c.border },
      ]}
    >
      {children}
    </View>
  );
}

/** Shows a code snippet (no clipboard module in the example app). */
export function CodeModal({
  code,
  title,
  onClose,
}: {
  code: string | null;
  title: string;
  onClose: () => void;
}) {
  const c = useChrome();
  return (
    <Modal
      visible={code !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.scrim, { backgroundColor: c.scrim }]}>
        <View
          testID="code-modal"
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: c.surfaceRaised }]}
        >
          <View style={styles.sheetHeader}>
            <Text
              accessibilityRole="header"
              style={[styles.sheetTitle, { color: c.textPrimary }]}
            >
              {title}
            </Text>
            <LinkButton label="Close" onPress={onClose} />
          </View>
          <ScrollView
            style={[styles.code, { backgroundColor: c.bgMuted }]}
            contentContainerStyle={styles.codeContent}
          >
            <Text
              selectable
              style={[styles.codeText, { color: c.textPrimary }]}
            >
              {code}
            </Text>
          </ScrollView>
          <Text style={[styles.rowDescription, { color: c.textSecondary }]}>
            Select the text to copy it.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  bold: { fontWeight: "600" },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 0.7 },
  pill: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  pillText: { fontSize: 13 },
  outline: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
  },
  link: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  linkText: { fontSize: 15, fontWeight: "600" },
  group: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15 },
  rowDescription: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 22 },
  scrim: { flex: 1, justifyContent: "center", padding: 16 },
  sheet: {
    borderRadius: 14,
    padding: 16,
    gap: 12,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: { fontSize: 17, fontWeight: "700" },
  code: { borderRadius: 8, flexGrow: 0 },
  codeContent: { padding: 12 },
  codeText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 13,
  },
});
