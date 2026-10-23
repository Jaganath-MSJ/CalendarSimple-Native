/**
 * @file Root container: measures, provides the theme and lays out the header
 * and body slots (TDD §8.1 steps 2–4).
 */
import { useCallback, useMemo, type ReactNode } from "react";
import {
  I18nManager,
  StyleSheet,
  useWindowDimensions,
  View,
  type DimensionValue as RNDimensionValue,
} from "react-native";
import { dateFn, resolveDirection, type ECalendarViewType } from "../core";
import { useCalendar } from "../context/CalendarContext";
import { useContainerLayout } from "../hooks/useContainerLayout";
import { useNavigate } from "../hooks/useNavigate";
import {
  CalendarThemeProvider,
  getBreakpoint,
  getMetrics,
  resolveFlip,
  resolvePalette,
  type CalendarThemeValue,
} from "../theme";
import type { DimensionValue } from "../types";
import { PeriodPager, type PageOffset } from "./navigation/PeriodPager";
import { CalendarErrorBoundary } from "./ui/CalendarErrorBoundary";

export interface CalendarContentProps {
  width?: DimensionValue;
  height?: DimensionValue;
  /** Compound mode: replaces the default header and body. */
  children?: ReactNode;
}

const num = (v: DimensionValue | undefined) =>
  typeof v === "number" ? v : undefined;

export function CalendarContent({
  width: widthProp,
  height: heightProp,
  children,
}: CalendarContentProps) {
  const { config, testId, colorScheme, state, dispatch } = useCalendar();
  const { width, onLayout } = useContainerLayout(
    num(widthProp),
    num(heightProp),
  );
  const { fontScale } = useWindowDimensions();
  const measured = width > 0;
  // getBreakpoint(NaN | 0) must not decide the layout; phone until measured.
  const breakpoint = measured ? getBreakpoint(width) : "phone";
  const { maxFontSizeMultiplier, palette: paletteOverrides } = config;
  const flip = resolveFlip(
    resolveDirection(config.direction, config.locale),
    I18nManager.isRTL,
  );

  const theme = useMemo<CalendarThemeValue>(
    () => ({
      palette: resolvePalette(colorScheme, paletteOverrides),
      metrics: getMetrics(breakpoint, fontScale, maxFontSizeMultiplier),
      scheme: colorScheme,
      breakpoint,
      flip,
      fontScale,
    }),
    [
      colorScheme,
      paletteOverrides,
      breakpoint,
      fontScale,
      maxFontSizeMultiplier,
      flip,
    ],
  );

  const { renderHeader, onNavigate, onViewChange } = config;
  const header = renderHeader
    ? renderHeader({
        currentDate: state.selectedDate.toJSDate(),
        view: state.view,
        onNavigate: (date: Date) => {
          dispatch({ type: "SET_DATE", payload: dateFn(date) });
          onNavigate?.(date);
        },
        onViewChange: (view: ECalendarViewType) => {
          dispatch({ type: "SET_VIEW", payload: view });
          onViewChange?.(view);
        },
      })
    : null;

  const navigate = useNavigate();
  // Until the views land (P4+), each page is an empty body slot.
  const renderPage = useCallback(
    (offset: PageOffset) =>
      offset === 0 ? (
        <View testID={`${testId}-body`} style={styles.body} />
      ) : (
        <View style={styles.body} />
      ),
    [testId],
  );

  return (
    <View
      testID={`${testId}-container`}
      onLayout={onLayout}
      style={[
        styles.container,
        widthProp !== undefined && { width: widthProp as RNDimensionValue },
        heightProp !== undefined && { height: heightProp as RNDimensionValue },
        config.styles.root,
      ]}
    >
      <CalendarThemeProvider value={theme}>
        <CalendarErrorBoundary>
          {children !== undefined ? (
            measured ? (
              children
            ) : null
          ) : (
            <>
              {header}
              {measured ? (
                <PeriodPager
                  enabled={config.swipeNavigation && state.view !== "schedule"}
                  width={width}
                  testID={testId}
                  renderPage={renderPage}
                  onPage={navigate}
                />
              ) : null}
            </>
          )}
        </CalendarErrorBoundary>
      </CalendarThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, overflow: "hidden" },
  body: { flex: 1 },
});
