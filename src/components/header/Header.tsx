/**
 * @file Calendar header: Today, previous/next, title and pickers
 * (port spec §4.1, TDD §8.3).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  dateFn,
  getHeaderTitle,
  getMonthList,
  getYearList,
  VIEW_ORDER,
  type ECalendarViewType,
  getVisibleDays,
  getVisibleRange,
  resolveMessages,
} from "../../core";
import { useCalendar } from "../../context/CalendarContext";
import { useNavigate } from "../../hooks/useNavigate";
import { useCalendarTheme } from "../../theme";
import type { CalendarProps } from "../../types";
import { AnchoredMenu, type MenuAnchor } from "../ui/AnchoredMenu";
import { MenuSheet, type MenuOption } from "../ui/MenuSheet";
import { NavButton } from "./NavButton";
import { PickerButton } from "./PickerButton";

type PickerKind = "view" | "month" | "year";
const NO_ANCHOR: MenuAnchor = { x: 0, y: 0, width: 0, height: 0 };

export type HeaderProps = Partial<
  Pick<
    CalendarProps,
    | "pastYearLength"
    | "futureYearLength"
    | "onNavigate"
    | "onViewChange"
    | "customDays"
    | "resetDateOnViewChange"
    | "localeMessages"
    | "showWeekNumbers"
  >
> & {
  /** Replaces web `headerClassName`; applied after `styles.header`. */
  headerStyle?: StyleProp<ViewStyle>;
};

export function Header(props: HeaderProps) {
  const { state, dispatch, config, testId } = useCalendar();
  const { palette, metrics, breakpoint, flip } = useCalendarTheme();
  const navigate = useNavigate(props.onNavigate);
  const compact = breakpoint !== "wide";

  const messages = useMemo(
    () =>
      props.localeMessages
        ? resolveMessages({ ...config.localeMessages, ...props.localeMessages })
        : config.messages,
    [props.localeMessages, config.localeMessages, config.messages],
  );
  const showWeekNumbers = props.showWeekNumbers ?? config.showWeekNumbers;

  const { view, selectedDate, customDays, scheduleExtraDays } = state;
  const { locale, weekStartsOn, weekEndsOn, scheduleDays } = config;
  const title = useMemo(() => {
    const visibleDays =
      view === "week" || view === "day" || view === "customDays"
        ? getVisibleDays(view, selectedDate, {
            weekStartsOn,
            weekEndsOn,
            customDays,
          })
        : [];
    const scheduleRange =
      view === "schedule"
        ? getVisibleRange(view, selectedDate, {
            weekStartsOn,
            weekEndsOn,
            customDays,
            scheduleDays,
            scheduleExtraDays,
          })
        : undefined;
    return getHeaderTitle({
      view,
      selectedDate,
      visibleDays,
      scheduleRange,
      locale,
      showWeekNumbers,
      compact: breakpoint === "phone",
    });
  }, [
    view,
    selectedDate,
    customDays,
    scheduleExtraDays,
    locale,
    weekStartsOn,
    weekEndsOn,
    scheduleDays,
    showWeekNumbers,
    breakpoint,
  ]);

  // Announce the new period after every navigation (not on mount).
  const announced = useRef(title);
  useEffect(() => {
    if (announced.current === title) return;
    announced.current = title;
    AccessibilityInfo.announceForAccessibility(title);
  }, [title]);

  // Role "header" keeps the title in the VoiceOver/TalkBack headings rotor.
  // increment/decrement fire on Android swipes and assistive tech; iOS only
  // routes them for "adjustable", so labelled custom actions mirror them.
  const titleActions = useMemo(
    () => [
      { name: "increment" },
      { name: "decrement" },
      { name: "next", label: messages.next },
      { name: "previous", label: messages.previous },
    ],
    [messages.next, messages.previous],
  );
  const onTitleAction = (e: AccessibilityActionEvent) => {
    const name = e.nativeEvent.actionName;
    if (name === "increment" || name === "next") navigate(1);
    else if (name === "decrement" || name === "previous") navigate(-1);
  };

  const goToday = () => {
    navigate(dateFn());
  };

  const customDaysOption = props.customDays ?? config.customDays;
  const pastYearLength = props.pastYearLength ?? config.pastYearLength;
  const futureYearLength = props.futureYearLength ?? config.futureYearLength;
  const resetDateOnViewChange =
    props.resetDateOnViewChange ?? config.resetDateOnViewChange;
  const onViewChange = props.onViewChange ?? config.onViewChange;

  const viewOptions = useMemo<MenuOption<ECalendarViewType>[]>(() => {
    const list: MenuOption<ECalendarViewType>[] = VIEW_ORDER.map((v) => ({
      label: messages[v],
      value: v,
      selected: v === view,
    }));
    if (customDaysOption && customDaysOption > 0 && customDaysOption < 11) {
      list.push({
        label: `${customDaysOption} ${messages.days}`,
        value: "customDays",
        selected: view === "customDays",
      });
    }
    return list;
  }, [messages, view, customDaysOption]);
  const monthOptions = useMemo<MenuOption<number>[]>(
    () =>
      getMonthList(locale).map((m) => ({
        label: m.label,
        value: m.value,
        selected: m.value === selectedDate.month - 1,
      })),
    [locale, selectedDate.month],
  );
  // getYearList self-extends with a selected year outside the range (#12A).
  const yearOptions = useMemo<MenuOption<number>[]>(
    () =>
      getYearList(pastYearLength, futureYearLength, selectedDate.year).map(
        (y) => ({
          label: String(y),
          value: y,
          selected: y === selectedDate.year,
        }),
      ),
    [pastYearLength, futureYearLength, selectedDate.year],
  );

  const [open, setOpen] = useState<PickerKind | null>(null);
  const [anchor, setAnchor] = useState<MenuAnchor>(NO_ANCHOR);
  const close = () => setOpen(null);

  const selectView = (v: ECalendarViewType) => {
    close();
    dispatch({ type: "SET_VIEW", payload: v });
    if (resetDateOnViewChange) {
      navigate(dateFn());
    }
    onViewChange?.(v);
  };
  const selectDate = (next: typeof selectedDate) => {
    close();
    navigate(next);
  };
  // Luxon clamps the day when the month or year changes (Jan 31 → Feb 28).
  const selectMonth = (m: number) =>
    selectDate(selectedDate.set({ month: m + 1 }));
  const selectYear = (y: number) => selectDate(selectedDate.set({ year: y }));

  const menus = {
    view: {
      title: messages.selectView,
      options: viewOptions,
      onSelect: selectView,
    },
    month: {
      title: messages.selectMonth,
      options: monthOptions,
      onSelect: selectMonth,
    },
    year: {
      title: messages.selectYear,
      options: yearOptions,
      onSelect: selectYear,
    },
  } as const;
  const labelOf = <V,>(options: MenuOption<V>[]) =>
    options.find((o) => o.selected)?.label ?? "";

  const renderMenu = () => {
    if (!open) return null;
    const menu = menus[open] as {
      title: string;
      options: MenuOption<string | number>[];
      onSelect: (v: string | number) => void;
    }; // The three menus differ only in their value type.
    const menuTestID = `${testId}-menu-${open}`;
    return compact ? (
      <MenuSheet
        visible
        title={menu.title}
        options={menu.options}
        onSelect={menu.onSelect}
        onClose={close}
        testID={menuTestID}
      />
    ) : (
      <AnchoredMenu
        visible
        anchor={anchor}
        options={menu.options}
        onSelect={menu.onSelect}
        onClose={close}
        testID={menuTestID}
      />
    );
  };

  const row = flip ? styles.rowReverse : styles.row;
  const pickers = (["view", "month", "year"] as const).map((kind) => (
    <PickerButton
      key={kind}
      kind={kind}
      label={labelOf(menus[kind].options as MenuOption<unknown>[])}
      measure={!compact}
      onPress={(frame) => {
        if (frame) setAnchor(frame);
        setOpen(kind);
      }}
      expanded={open === kind}
      testID={`${testId}-header-${kind}-select`}
    />
  ));

  return (
    <View
      testID={`${testId}-header`}
      accessibilityLabel={messages.calendarNavigation}
      style={[
        styles.header,
        {
          padding: metrics.header.padding,
          borderBottomColor: palette.border,
          backgroundColor: palette.bg,
        },
        config.styles.header,
        props.headerStyle,
      ]}
    >
      <View style={[row, styles.gap]}>
        <Pressable
          testID={`${testId}-header-today-btn`}
          onPress={goToday}
          accessibilityRole="button"
          accessibilityLabel={messages.today}
          hitSlop={Math.max(
            0,
            Math.ceil((metrics.touchTarget - metrics.header.controlHeight) / 2),
          )}
          style={({ pressed }) => [
            styles.today,
            {
              height: metrics.header.controlHeight,
              borderColor: palette.border,
              backgroundColor: pressed ? palette.bgMuted : palette.bg,
            },
          ]}
        >
          <Text
            maxFontSizeMultiplier={config.maxFontSizeMultiplier}
            style={[
              styles.todayText,
              {
                color: palette.textPrimary,
                fontSize: metrics.header.controlFontSize,
              },
            ]}
          >
            {messages.today}
          </Text>
        </Pressable>
        <NavButton
          direction="prev"
          onPress={() => navigate(-1)}
          testID={`${testId}-header-prev-btn`}
          accessibilityLabel={messages.previous}
        />
        <NavButton
          direction="next"
          onPress={() => navigate(1)}
          testID={`${testId}-header-next-btn`}
          accessibilityLabel={messages.next}
        />
        <View
          testID={`${testId}-header-title`}
          accessible
          accessibilityRole="header"
          accessibilityLabel={title}
          accessibilityActions={titleActions}
          onAccessibilityAction={onTitleAction}
          style={styles.title}
        >
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={config.maxFontSizeMultiplier}
            style={[
              styles.titleText,
              {
                color: palette.textPrimary,
                fontSize: metrics.header.titleFontSize,
              },
            ]}
          >
            {title}
          </Text>
        </View>
        {compact ? null : <View style={[row, styles.gap]}>{pickers}</View>}
      </View>
      {compact ? (
        <View
          testID={`${testId}-header-row-2`}
          style={[row, styles.gap, styles.row2]}
        >
          {pickers}
        </View>
      ) : null}
      {renderMenu()}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: "row", alignItems: "center" },
  rowReverse: { flexDirection: "row-reverse", alignItems: "center" },
  gap: { gap: 8 },
  row2: { marginTop: 8 },
  today: {
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayText: { fontWeight: "500" },
  title: { flex: 1 },
  titleText: { fontWeight: "600" },
});
