// React-free. The daily series HairlineLine and HairlineArea share: one
// reading per day, a date as an ISO string, a value that may be a gap.
import { z } from "zod";

/** A calendar day ("2024-03-04") or an instant ("2024-03-04T09:00:00Z"). */
export const isoDateSchema = z.union([z.iso.date(), z.iso.datetime()]);

/**
 * One reading. `value` is null (or, from TypeScript, NaN or infinite) for a
 * day with no reading: the chart draws a gap there, not a zero.
 */
export const dailyDatumSchema = z.strictObject({
  date: isoDateSchema,
  /** Names the reading, and is its key; without it the date is. */
  id: z.string().min(1).optional(),
  value: z.number().nullable(),
});

/** One reading. */
export type DailyDatum = z.infer<typeof dailyDatumSchema>;
