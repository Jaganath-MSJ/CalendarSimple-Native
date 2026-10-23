/**
 * @file A card anchored to a frame in a transparent `Modal` (port spec §4.6).
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useCalendarConfig } from "../../context/CalendarContext";
import { useReduceMotion } from "../../hooks/useReduceMotion";
import { useCalendarTheme } from "../../theme";
import { placePopover, type Frame } from "./placePopover";

export interface AnchoredPopoverProps {
  visible: boolean;
  /** Window frame of the anchor; the card stays hidden until it is known. */
  anchor: Frame | null;
  width: number;
  onClose: () => void;
  /** Modal test ID; the card gets `contentTestID`. */
  testID?: string;
  contentTestID?: string;
  /** Accessibility label of the card. */
  label: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * Outside taps and the Android back button close it. The card is measured
 * first, then placed with `placePopover` and faded in over 200 ms (no motion
 * with Reduce Motion).
 */
export function AnchoredPopover({
  visible,
  anchor,
  width,
  onClose,
  testID,
  contentTestID,
  label,
  style,
  children,
}: AnchoredPopoverProps) {
  const { palette } = useCalendarTheme();
  const { config } = useCalendarConfig();
  const viewport = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const [height, setHeight] = useState<number | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const translateY = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
    [progress],
  );
  const placed =
    anchor && height !== null
      ? placePopover(anchor, { width, height }, viewport)
      : null;
  const ready = placed !== null;

  useEffect(() => {
    if (!visible) {
      setHeight(null);
      progress.setValue(0);
    }
  }, [visible, progress]);

  useEffect(() => {
    if (!ready) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [ready, reduceMotion, progress]);

  if (!visible) return null;
  return (
    <Modal
      testID={testID}
      visible
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel={config.messages.close}
      />
      <Animated.View
        testID={contentTestID}
        accessibilityViewIsModal
        accessibilityLabel={label}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          // Keep the natural height; a capped layout must not re-place it.
          setHeight((prev) => prev ?? h);
        }}
        style={[
          styles.card,
          {
            width,
            left: placed?.left ?? 0,
            top: placed?.top ?? 0,
            backgroundColor: palette.surfaceRaised,
            borderColor: palette.border,
            opacity: progress,
            transform: [{ translateY }],
          },
          placed?.maxHeight !== undefined && { maxHeight: placed.maxHeight },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
