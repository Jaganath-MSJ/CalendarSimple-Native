/**
 * @file Luxon date aliases shared by the core.
 */
import type { DateTime } from "luxon";

/** Internal date type: every core date is a Luxon `DateTime`. */
export type DateType = DateTime;
/** Anything `dateFn` can normalise into a `DateType`. */
export type DateInputType = Date | DateTime | string | number;
