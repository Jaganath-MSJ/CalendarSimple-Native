/**
 * @file Accessibility audit over a rendered host tree (P9.S2).
 */
import type { TestInstance } from "test-renderer";

type Node = TestInstance | string;

/**
 * `accessible={false}` opts an element out on purpose (the time-grid column
 * hands screen readers per-hour slot buttons instead), so it is skipped.
 */
const isPressable = (n: TestInstance): boolean =>
  n.props.accessible !== false &&
  n.props.importantForAccessibility !== "no-hide-descendants" &&
  (typeof n.props.onClick === "function" ||
    typeof n.props.onPress === "function" ||
    typeof n.props.onLongPress === "function" ||
    typeof n.props.onResponderRelease === "function");

const textOf = (node: Node): string =>
  typeof node === "string" ? node : node.children.map(textOf).join("");

const hasName = (n: TestInstance): boolean => {
  const label: unknown = n.props.accessibilityLabel ?? n.props["aria-label"];
  if (typeof label === "string" && label.trim() !== "") return true;
  return textOf(n).trim() !== "";
};

const hasRole = (n: TestInstance): boolean =>
  Boolean(n.props.accessibilityRole ?? n.props.role);

/**
 * Test IDs of host elements that respond to presses but lack an
 * `accessibilityRole` or an accessible name (label or text content).
 * Elements without a test ID are reported as `"<no testID>"`.
 * Pass `screen.container` (RNTL 14) or any host instance.
 */
export function findUnlabelledInteractive(root: TestInstance | null): string[] {
  if (!root) return [];
  return root
    .queryAll(isPressable, { includeSelf: true })
    .filter((n) => !hasRole(n) || !hasName(n))
    .map((n) => (n.props.testID as string | undefined) ?? "<no testID>");
}
