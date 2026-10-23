/**
 * @file Fade-in when loading ends (port spec §4.8, TDD §12): opacity 0 → 1
 * over 150 ms on the native driver; instant under Reduce Motion.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet } from "react-native";
import { useReduceMotion } from "../../hooks/useReduceMotion";

const FADE_MS = 150;

export interface FadeInProps {
  /** The loading flag; the fade runs when it flips from `true` to `false`. */
  trigger: boolean;
  children: ReactNode;
}

export function FadeIn({ trigger, children }: FadeInProps) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduceMotion = useReduceMotion();
  const wasLoading = useRef(trigger);

  useEffect(() => {
    const ended = wasLoading.current && !trigger;
    wasLoading.current = trigger;
    if (!ended || reduceMotion) return;
    opacity.setValue(0);
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      opacity.setValue(1);
    };
  }, [trigger, reduceMotion, opacity]);

  return (
    <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
