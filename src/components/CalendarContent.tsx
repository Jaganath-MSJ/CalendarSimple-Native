/**
 * @file Root container: measures, provides the theme and lays out the header
 * and body slots (TDD §8.1 steps 2–4).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type DimensionValue as RNDimensionValue,
} from "react-native";
import { dateFn, getNavigatedDate, resolveDirection } from "../core";
import { useCalendar } from "../context/CalendarContext";
import {
  DragStateProvider,
  useGestureAdapter,
  ZoomStateProvider,
} from "../context/GestureAdapterContext";
import { CalendarLayoutProvider, PageProvider } from "../context/LayoutContext";
import { useContainerLayout } from "../hooks/useContainerLayout";
import { useNavigate } from "../hooks/useNavigate";
import { useViewChange } from "../hooks/useViewChange";
import {
  CalendarThemeProvider,
  getBreakpoint,
  getMetrics,
  resolveFlip,
  resolvePalette,
  type CalendarThemeValue,
} from "../theme";
import type { DimensionValue } from "../types";
import { Header } from "./header/Header";
import { PeriodPager, type PageOffset } from "./navigation/PeriodPager";
import { CalendarErrorBoundary } from "./ui/CalendarErrorBoundary";
import { ViewSkeleton } from "./ui/Skeletons";
import { View as CalendarView } from "./views/View";
import { useAppIsRTL } from "../hooks/useAppIsRTL";

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
  const { config, testId, colorScheme, state } = useCalendar();
  const { width, height, onLayout } = useContainerLayout(
    num(widthProp),
    num(heightProp),
  );
  const { fontScale } = useWindowDimensions();
  const appIsRTL = useAppIsRTL();
  const measured = width > 0;
  // getBreakpoint(NaN | 0) must not decide the layout; phone until measured.
  const breakpoint = measured ? getBreakpoint(width) : "phone";
  const { maxFontSizeMultiplier, palette: paletteOverrides } = config;
  const flip = resolveFlip(
    resolveDirection(config.direction, config.locale),
    appIsRTL,
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

  // draggable / resizable without <CalendarGestures>: only the
  // screen-reader actions change events.
  const { EventWrapper } = useGestureAdapter();
  const editable =
    (Boolean(config.draggable) && Boolean(config.onEventDrop)) ||
    (Boolean(config.resizable) && Boolean(config.onEventResize)) ||
    Boolean(config.pinchToZoom);
  const withoutGestures = editable && !EventWrapper;
  useEffect(() => {
    if (__DEV__ && withoutGestures)
      console.warn(
        "[calendar] draggable / resizable / pinchToZoom: wrap the calendar " +
          'in <CalendarGestures> from "calendar-simple-native/gestures" for ' +
          "the gestures; without it only the screen-reader actions work.",
      );
  }, [withoutGestures]);

  const navigate = useNavigate();
  const changeView = useViewChange(navigate);
  const { renderHeader } = config;
  const header = renderHeader ? (
    renderHeader({
      currentDate: state.selectedDate.toJSDate(),
      view: state.view,
      onNavigate: (date: Date) => navigate(dateFn(date)),
      onViewChange: changeView,
    })
  ) : (
    <Header />
  );

  const { view, customDays, selectedDate } = state;
  // The current page carries the body test ID; neighbours render the
  // previous/next period without test IDs.
  const renderPage = useCallback(
    (offset: PageOffset) =>
      offset === 0 ? (
        <View testID={`${testId}-body`} style={styles.body}>
          <CalendarView />
        </View>
      ) : (
        <PageProvider value={false}>
          <View style={styles.body}>
            <CalendarView
              date={getNavigatedDate(
                { view, customDays, selectedDate },
                offset,
              )}
            />
          </View>
        </PageProvider>
      ),
    [testId, view, customDays, selectedDate],
  );

  // Neighbour pages show the view's skeleton until idle (TDD §8.5).
  const renderPlaceholder = useCallback(
    () => (
      <PageProvider value={false}>
        <View style={styles.body}>
          <ViewSkeleton view={view} />
        </View>
      </PageProvider>
    ),
    [view],
  );

  const [headerHeight, setHeaderHeight] = useState<number | undefined>();
  const layout = useMemo(
    () => ({ width, height, headerHeight }),
    [width, height, headerHeight],
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
        <DragStateProvider>
          <ZoomStateProvider>
            <CalendarLayoutProvider value={layout}>
              <CalendarErrorBoundary>
                {children !== undefined ? (
                  measured ? (
                    children
                  ) : null
                ) : (
                  <>
                    <View
                      onLayout={(e) =>
                        setHeaderHeight(e.nativeEvent.layout.height)
                      }
                    >
                      {header}
                    </View>
                    {measured ? (
                      <PeriodPager
                        enabled={
                          config.swipeNavigation && state.view !== "schedule"
                        }
                        width={width}
                        testID={testId}
                        renderPage={renderPage}
                        renderPlaceholder={renderPlaceholder}
                        onPage={navigate}
                        flip={flip}
                      />
                    ) : null}
                  </>
                )}
              </CalendarErrorBoundary>
            </CalendarLayoutProvider>
          </ZoomStateProvider>
        </DragStateProvider>
      </CalendarThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  // Fill the parent but never outgrow it: on web, CSS sizes a non-shrinking
  // box by its content (Yoga does not), which left the time grid and the
  // schedule list as tall as their content, with nothing to scroll.
  container: { flexGrow: 1, flexShrink: 1, overflow: "hidden" },
  body: { flex: 1 },
});
