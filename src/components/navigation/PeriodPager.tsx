/**
 * @file Three-page horizontal pager for previous/current/next periods (TDD §8.5).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useAppIsRTL } from "../../hooks/useAppIsRTL";

export type PageOffset = -1 | 0 | 1;

export interface PeriodPagerProps {
  enabled: boolean;
  width: number;
  testID: string;
  renderPage: (offset: PageOffset) => ReactNode;
  /** Neighbour pages until the first idle period (TDD §8.5: the skeleton). */
  renderPlaceholder?: (offset: PageOffset) => ReactNode;
  onPage: (direction: 1 | -1) => void;
  /**
   * The calendar is mirrored relative to the app (TDD §8.1): the next period
   * then sits on the other side, so the page order reverses.
   */
  flip?: boolean;
}

const PAGES: PageOffset[] = [-1, 0, 1];
const PAGES_FLIPPED: PageOffset[] = [1, 0, -1];
const keyOf = (o: PageOffset) => String(o);

/**
 * Runs `cb` once the JS thread is idle (`InteractionManager` was removed
 * from React Native core; `requestIdleCallback` replaces it).
 */
function whenIdle(cb: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(cb);
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(cb, 0);
  return () => clearTimeout(id);
}

export function PeriodPager({
  enabled,
  width,
  testID,
  renderPage,
  renderPlaceholder,
  onPage,
  flip = false,
}: PeriodPagerProps) {
  const appIsRTL = useAppIsRTL();
  const pages = flip ? PAGES_FLIPPED : PAGES;
  const listRef = useRef<FlatList<PageOffset>>(null);
  const [neighboursReady, setNeighboursReady] = useState(false);
  const [recenter, setRecenter] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    return whenIdle(() => setNeighboursReady(true));
  }, [enabled]);

  // Runs after the navigation state update commits with the new pages.
  useLayoutEffect(() => {
    if (recenter === 0) return;
    listRef.current?.scrollToIndex({ index: 1, animated: false });
  }, [recenter]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      // contentOffset.x is physical (from the left) on iOS and Android, while
      // an RTL app lays the list out from the right (VirtualizedList converts
      // the same way), so map the physical page back to the data index.
      const physical = Math.round(e.nativeEvent.contentOffset.x / width);
      const index = appIsRTL ? pages.length - 1 - physical : physical;
      const offset = pages[index];
      if (offset === undefined || offset === 0) return;
      onPage(offset);
      setRecenter((n) => n + 1);
    },
    [onPage, width, appIsRTL, pages],
  );

  // A stable array, so FlatList re-renders pages only when these change.
  const extraData = useMemo(
    () => [renderPage, neighboursReady],
    [renderPage, neighboursReady],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<PageOffset> | null | undefined, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const renderItem = ({ item }: ListRenderItemInfo<PageOffset>) => (
    <View style={[styles.page, { width }]}>
      {item === 0 || neighboursReady
        ? renderPage(item)
        : (renderPlaceholder?.(item) ?? null)}
    </View>
  );

  if (!enabled) {
    return <View style={[styles.page, { width }]}>{renderPage(0)}</View>;
  }

  return (
    <FlatList
      ref={listRef}
      testID={`${testID}-pager`}
      style={styles.list}
      data={pages}
      keyExtractor={keyOf}
      renderItem={renderItem}
      extraData={extraData}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={1}
      initialNumToRender={3}
      windowSize={3}
      getItemLayout={getItemLayout}
      onMomentumScrollEnd={onMomentumScrollEnd}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  page: { flex: 1 },
});
