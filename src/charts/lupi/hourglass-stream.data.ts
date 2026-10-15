/**
 * L13 Library earnings: how many UK writers, illustrators and others were paid
 * at least a given sum for library loans in one year.
 *
 * Source: British Library, Public Lending Right (PLR) page, "Shown below is
 * how the UK PLR earnings were distributed amongst registered contributors for
 * the 2024/25 year" (payments by pay band, rate 12.40p a loan, minimum payment
 * £1, maximum £6,600).
 * Page: https://www.bl.uk/plr
 * Fetched 2026-10-15. The page is British Library web content; only the
 * published counts are used.
 *
 * Transform: the page gives payments per band: £1 to £99.99 19,039; £100 to
 * £499.99 3,399; £500 to £999.99 973; £1,000 to £2,499.99 877; £2,500 to
 * £4,999.99 393; £5,000 to £6,600 311 (total 24,992, which the bands sum to).
 * Each stage is the cumulative count of payments at or above its threshold:
 * £1 or more 24,992; £100 or more 5,953; £500 or more 2,554; £1,000 or more
 * 1,581; £2,500 or more 704; £5,000 or more 311.
 * Script: reference/scripts/L13/bands.py.
 */

/** One funnel stage and how many reached it. */
export interface StageDatum {
  label: string;
  value: number;
}

/** Payments at or above each sum, UK PLR 2024/25. */
export const hourglassDemo: StageDatum[] = [
  { label: "£1 or more", value: 24_992 },
  { label: "£100 or more", value: 5953 },
  { label: "£500 or more", value: 2554 },
  { label: "£1,000 or more", value: 1581 },
  { label: "£2,500 or more", value: 704 },
  { label: "£5,000 or more", value: 311 },
];
