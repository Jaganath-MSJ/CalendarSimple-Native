/**
 * @file allDayBanner.ts
 * @description Core logic for calculating the layout of the all-day and multi-day events banner.
 *
 * This utility handles the complex task of:
 * 1. Filtering events that span multiple days or are marked as all-day.
 * 2. Identifying intersecting events within the currently visible days.
 * 3. Sorting events to optimize visual flow (longest events first).
 * 4. Stacking events vertically using a Tetris-like row assignment algorithm to avoid overlap.
 * 5. Calculating expand/collapse states and dynamically resolving container heights.
 */

import { dateFn, type DateType } from "../utils/date";
import type {
  BannerLayout,
  BannerLayoutEvent,
  BaseCalendarEvent,
} from "../types";
import {
  isAllDayEvent,
  isMultiDay,
  getEventOverlapInHours,
  getLastEventDay,
} from "../utils/common";
import { LAYOUT_CONSTANTS } from "../constants";

/**
 * Calculates layout and positioning for multi-day and all-day events in a banner view.
 * It determines which events are visible, how they stack vertically to avoid overlapping,
 * and handles an expanded/collapsed state when there are too many concurrent events.
 *
 * @param days - The array of days currently visible in the calendar view.
 * @param events - The complete array of calendar events to filter and layout.
 * @param isExpanded - Whether the banner is currently expanded to show all stacked events.
 * @param maxVisibleRows - The maximum number of event rows to show before collapsing (default: 3).
 * @returns An object containing layout details:
 * - `layoutEvents`: All calculated events that intersect with the current view.
 * - `rowCount`: The total number of rows required to display all events without overlap.
 * - `effectiveMaxRows`: The effective limit on visible rows.
 * - `hiddenCounts`: An array representing the number of hidden events for each day index.
 * - `hasHiddenEvents`: A boolean flag indicating if any events exceed the `maxVisibleRows`.
 * - `visibleLayoutEvents`: The events that should currently be rendered based on the `isExpanded` state.
 * - `containerHeight`: The computed height of the banner container.
 * - `showExpandCollapse`: A boolean flag indicating if the expand/collapse button should be rendered.
 */
export function layoutAllDayBanner<E extends BaseCalendarEvent>(
  days: DateType[],
  events: E[],
  isExpanded: boolean,
  maxVisibleRows = 3,
): BannerLayout<E> {
  {
    if (days.length === 0) {
      return {
        layoutEvents: [],
        rowCount: 0,
        effectiveMaxRows: maxVisibleRows,
        hiddenCounts: [],
        hasHiddenEvents: false,
        visibleLayoutEvents: [],
        containerHeight: 28,
        showExpandCollapse: false,
      };
    }

    const viewStart = dateFn(days[0]).startOf("day");
    const viewEnd = dateFn(days[days.length - 1]).startOf("day");

    // -------------------------------------------------------------------------
    // 1. Event Filtering: Multi-day and All-day events
    // -------------------------------------------------------------------------
    const multiDayEvents = events.filter(
      (e) => isMultiDay(e) || isAllDayEvent(e),
    );

    // -------------------------------------------------------------------------
    // 2. Event Identification: Intersecting Events (via hybrid slices)
    // -------------------------------------------------------------------------
    const processedEvents = multiDayEvents.map((event) => {
      const exactStart = dateFn(event.startDate);
      const exactEnd = event.endDate ? dateFn(event.endDate) : exactStart;

      let bannerStartDay = exactStart.startOf("day");
      if (
        !isAllDayEvent(event) &&
        getEventOverlapInHours(event, bannerStartDay) < 12
      ) {
        bannerStartDay = bannerStartDay.plus({ days: 1 });
      }

      let bannerEndDay = exactEnd.startOf("day");
      if (
        !isAllDayEvent(event) &&
        getEventOverlapInHours(event, bannerEndDay) < 12
      ) {
        bannerEndDay = bannerEndDay.minus({ days: 1 });
      }

      // #8: compare against the last day the event occupies, so a timed
      // event ending at exactly 00:00 shows no right arrow.
      const lastDay = getLastEventDay(event);
      return { event, bannerStartDay, bannerEndDay, exactStart, lastDay };
    });

    const intersectingEvents = processedEvents.filter(
      ({ bannerStartDay, bannerEndDay }) => {
        if (bannerStartDay > bannerEndDay) return false;
        // Intersects if start is before viewEnd AND end is after viewStart
        return (
          (bannerStartDay < viewEnd || bannerStartDay.equals(viewEnd)) &&
          (bannerEndDay > viewStart || bannerEndDay.equals(viewStart))
        );
      },
    );

    // -------------------------------------------------------------------------
    // 3. Event Sorting: Start Date asc, then Duration desc
    //
    // Sorting by start date ensures chronological order left-to-right.
    // Secondary sorting by duration (descending) puts longer events at the top,
    // reducing visual fragmentation and allowing shorter events to tile underneath nicely.
    // -------------------------------------------------------------------------
    intersectingEvents.sort((a, b) => {
      const startA = dateFn(a.event.startDate).valueOf();
      const startB = dateFn(b.event.startDate).valueOf();
      if (startA === startB) {
        const durA = a.event.endDate
          ? dateFn(a.event.endDate).valueOf() - startA
          : 0;
        const durB = b.event.endDate
          ? dateFn(b.event.endDate).valueOf() - startB
          : 0;
        return durB - durA; // longest first
      }
      return startA - startB;
    });

    const rows: BannerLayoutEvent<E>[][] = [];
    const layoutEvents: BannerLayoutEvent<E>[] = [];

    // -------------------------------------------------------------------------
    // 4. Slot Assignment: "Tetris" Algorithm
    //
    // The goal here is to calculate the start and end column index for each event
    // and assign a vertical "row" index so no overlapping events share a row.
    // -------------------------------------------------------------------------
    intersectingEvents.forEach(
      ({ event, bannerStartDay, bannerEndDay, exactStart, lastDay }) => {
        // Calculate bound indices for the current visible view
        let startIndex = days.findIndex((d) =>
          dateFn(d).startOf("day").equals(bannerStartDay),
        );
        if (startIndex === -1 && bannerStartDay < viewStart) {
          startIndex = 0;
        }

        let endIndex = days.findIndex((d) =>
          dateFn(d).startOf("day").equals(bannerEndDay),
        );
        if (endIndex === -1 && bannerEndDay > viewEnd) {
          endIndex = days.length - 1;
        }

        // It might happen that the event is completely outside the days, but we already filtered for intersections.
        if (startIndex === -1) startIndex = 0;
        if (endIndex === -1) endIndex = days.length - 1;

        const isClippedLeft =
          bannerStartDay < viewStart ||
          exactStart.startOf("day") < bannerStartDay;
        const isClippedRight = bannerEndDay > viewEnd || lastDay > bannerEndDay;

        // Row stacking: Find the lowest row index where the event fits without overlap
        let rowIndex = 0;
        while (true) {
          const row = rows[rowIndex];
          if (!row) {
            rows[rowIndex] = [];
            break;
          }
          const hasOverlap = row.some((existingEvent) => {
            return (
              startIndex <= existingEvent.endIndex &&
              endIndex >= existingEvent.startIndex
            );
          });
          if (!hasOverlap) {
            break;
          }
          rowIndex++;
        }

        const layoutEvent: BannerLayoutEvent<E> = {
          event,
          startIndex,
          endIndex,
          isClippedLeft,
          isClippedRight,
          row: rowIndex,
        };

        rows[rowIndex]!.push(layoutEvent);
        layoutEvents.push(layoutEvent);
      },
    );

    const rowCount = rows.length;

    const effectiveMaxRows =
      rowCount === maxVisibleRows + 1 ? maxVisibleRows + 1 : maxVisibleRows;

    const hiddenCounts: number[] = new Array<number>(days.length).fill(0);
    // -------------------------------------------------------------------------
    // 5. Overflow and Display Calculation
    //
    // Manage which events are hidden under an "expand" toggle if there
    // are too many concurrent rows, and compute height/visibility states accordingly.
    // -------------------------------------------------------------------------
    layoutEvents.forEach((ev) => {
      if (ev.row >= effectiveMaxRows) {
        for (
          let i = Math.max(0, ev.startIndex);
          i <= Math.min(days.length - 1, ev.endIndex);
          i++
        ) {
          hiddenCounts[i] = (hiddenCounts[i] ?? 0) + 1;
        }
      }
    });

    const hasHiddenEvents = hiddenCounts.some((count) => count > 0);

    const visibleLayoutEvents = isExpanded
      ? layoutEvents
      : layoutEvents.filter((ev) => ev.row < effectiveMaxRows);

    const containerHeight = isExpanded
      ? Math.max(
          rowCount * LAYOUT_CONSTANTS.ALL_DAY_ROW_HEIGHT + 4,
          LAYOUT_CONSTANTS.DATE_LABEL_HEIGHT,
        )
      : hasHiddenEvents
        ? Math.max(
            (effectiveMaxRows + 1) * LAYOUT_CONSTANTS.ALL_DAY_ROW_HEIGHT + 4,
            LAYOUT_CONSTANTS.DATE_LABEL_HEIGHT,
          )
        : Math.max(
            rowCount * LAYOUT_CONSTANTS.ALL_DAY_ROW_HEIGHT + 4,
            LAYOUT_CONSTANTS.DATE_LABEL_HEIGHT,
          );

    const showExpandCollapse = hasHiddenEvents || isExpanded;

    return {
      layoutEvents,
      rowCount,
      effectiveMaxRows,
      hiddenCounts,
      hasHiddenEvents,
      visibleLayoutEvents,
      containerHeight,
      showExpandCollapse,
    };
  }
}
