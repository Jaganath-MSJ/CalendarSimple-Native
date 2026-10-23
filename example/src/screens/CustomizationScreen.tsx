/**
 * @file Parity with web `Customization.stories.tsx`. CSS-only styling
 * (`classNames`, borders and fonts in `event.style`) maps to `styles` and the
 * colour keys of `event.style`.
 */
import { DateTime } from "luxon";
import { Pressable, Text, View } from "react-native";
import {
  ECalendarViewType,
  type CalendarEvent,
  type ColorScheme,
} from "../../../src";
import ScenarioScreen, { type Scenario } from "../components/ScenarioScreen";
import { at, today } from "../fixtures/storyEvents";

const customizeEvents: CalendarEvent[] = [
  {
    id: "1",
    startDate: at(10),
    endDate: at(12),
    title: "Static Style (Red Border)",
    style: { borderColor: "red" },
  },
  {
    id: "2",
    startDate: at(13),
    endDate: at(15),
    title: "Static Style (Opacity)",
    style: { backgroundColor: "#10B981", opacity: 0.5 },
  },
  {
    id: "3",
    startDate: at(9, 0, 1),
    title: "All Day Style",
  },
];

const colorSchemeEvents: CalendarEvent[] = [
  {
    id: "cs1",
    startDate: at(today.hour + 2 > 23 ? 23 : today.hour + 2),
    title: "Team Standup",
    style: { backgroundColor: "#3b82f6", color: "#fff" },
  },
  {
    id: "cs2",
    startDate: at(10, 0, 1),
    endDate: at(12, 0, 1),
    title: "Design Review",
    style: { backgroundColor: "#8b5cf6", color: "#fff" },
  },
  {
    id: "cs3",
    startDate: today.plus({ days: 2 }).toFormat("yyyy-MM-dd"),
    title: "All-day: Conference",
    style: { backgroundColor: "#10b981", color: "#fff" },
  },
];

const selectedDate = today.toJSDate();
const fmtTime = (iso?: string) =>
  iso ? DateTime.fromISO(iso).toFormat("h:mm a") : "";

const scheme = (
  name: string,
  colorScheme: ColorScheme,
  view: ECalendarViewType = ECalendarViewType.week,
  extra: { showWeekNumbers?: boolean } = {},
): Scenario => ({
  name,
  props: () => ({
    view,
    events: colorSchemeEvents,
    selectedDate,
    colorScheme,
    ...extra,
  }),
});

const SCENARIOS: Scenario[] = [
  {
    name: "Event style",
    props: () => ({
      view: ECalendarViewType.week,
      events: customizeEvents,
      selectedDate,
    }),
  },
  {
    name: "Event styles key",
    props: () => ({
      view: ECalendarViewType.month,
      events: [{ id: "4", startDate: at(0), title: "Event with styles" }],
      selectedDate,
      styles: { event: { borderLeftWidth: 4, borderLeftColor: "black" } },
    }),
  },
  {
    name: "Schedule customization",
    props: () => ({
      view: ECalendarViewType.schedule,
      events: customizeEvents,
      selectedDate,
    }),
  },
  {
    name: "Custom renderers",
    props: () => ({
      view: ECalendarViewType.week,
      events: customizeEvents,
      selectedDate,
      renderEvent: (event) => (
        <View style={{ padding: 4, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#3b82f6",
              }}
            />
            <Text style={{ color: "#1e293b", fontWeight: "600" }}>
              {event.title}
            </Text>
          </View>
          <Text style={{ color: "#64748b", fontSize: 11 }}>
            {fmtTime(event.startDate)} - {fmtTime(event.endDate)}
          </Text>
        </View>
      ),
      renderHeader: ({ currentDate, view, onNavigate, onViewChange }) => {
        const current = DateTime.fromJSDate(currentDate);
        return (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(
                [
                  ["Previous", -1],
                  ["Next", 1],
                ] as const
              ).map(([label, step]) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  onPress={() =>
                    onNavigate(current.plus({ weeks: step }).toJSDate())
                  }
                  style={{
                    paddingHorizontal: 16,
                    minHeight: 44,
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ color: "#475569" }}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ fontWeight: "700", fontSize: 18 }}>
              {current.toFormat("MMMM yyyy")}
            </Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {(["day", "week", "month"] as const).map((v) => (
                <Pressable
                  key={v}
                  accessibilityRole="button"
                  accessibilityState={{ selected: view === v }}
                  onPress={() => onViewChange(v)}
                  style={{
                    paddingHorizontal: 12,
                    minHeight: 44,
                    justifyContent: "center",
                    borderRadius: 9999,
                    backgroundColor: view === v ? "#f1f5f9" : "transparent",
                  }}
                >
                  <Text style={{ textTransform: "capitalize" }}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      },
      renderDateCell: ({ date, isToday }) => (
        <View style={{ alignItems: "center", gap: 2, paddingVertical: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: isToday ? "#3b82f6" : "#64748b",
            }}
          >
            {DateTime.fromJSDate(date).toFormat("ccc").toUpperCase()}
          </Text>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isToday ? "#3b82f6" : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                color: isToday ? "white" : "#1e293b",
              }}
            >
              {DateTime.fromJSDate(date).toFormat("d")}
            </Text>
          </View>
        </View>
      ),
      renderHourCell: (slot) => {
        const hour = slot.getHours();
        return (
          <View
            style={{
              flex: 1,
              backgroundColor:
                hour >= 9 && hour < 18
                  ? "transparent"
                  : "rgba(248, 250, 252, 0.4)",
            }}
          />
        );
      },
    }),
  },
  {
    name: "Reset on view change",
    props: () => ({
      view: ECalendarViewType.month,
      events: customizeEvents,
      selectedDate,
      selectable: true,
      resetDateOnViewChange: true,
    }),
  },
  {
    name: "Overlap stacking",
    props: () => ({
      view: ECalendarViewType.day,
      selectedDate,
      eventOverlapOffset: 15,
      events: [
        ["1", 10, 0, 12, 0, "#1a73e8"],
        ["2", 10, 30, 12, 30, "#d93025"],
        ["3", 11, 0, 13, 0, "#f9ab00"],
      ].map(([id, sh, sm, eh, em, backgroundColor]) => ({
        id: id as string,
        title: `Event ${id}`,
        startDate: at(sh as number, sm as number),
        endDate: at(eh as number, em as number),
        style: { backgroundColor: backgroundColor as string },
      })),
    }),
  },
  {
    name: "Schedule separator",
    props: () => ({
      view: ECalendarViewType.schedule,
      events: customizeEvents,
      selectedDate,
      renderScheduleSeparator: (date) => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#dadce0" }} />
          <Text style={{ paddingHorizontal: 16, color: "#70757a" }}>
            SEPARATOR FOR {date.toLocaleDateString()}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#dadce0" }} />
        </View>
      ),
    }),
  },
  {
    name: "Palette",
    props: () => ({
      view: ECalendarViewType.week,
      events: colorSchemeEvents,
      selectedDate,
      palette: {
        light: { primary: "#7c3aed", nowLine: "#db2777" },
        dark: { primary: "#a78bfa" },
      },
      showCurrentTime: true,
    }),
  },
  scheme("Light", "light"),
  scheme("Dark", "dark"),
  scheme("Auto", "auto"),
  scheme("Dark month", "dark", ECalendarViewType.month, {
    showWeekNumbers: true,
  }),
  scheme("Dark schedule", "dark", ECalendarViewType.schedule),
];

export default function CustomizationScreen() {
  return <ScenarioScreen scenarios={SCENARIOS} />;
}
