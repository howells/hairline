/**
 * L14 A hundred donors: the blood types of a hundred blood donors in England.
 *
 * Source: NHS Blood and Transplant, "Blood types" page, the list "the
 * percentage of donors with each blood type" (data accurate at February 2026;
 * figures rounded to the nearest whole number by NHSBT).
 * Page: https://www.blood.co.uk/why-give-blood/blood-types/
 * Fetched 2026-10-15.
 *
 * Transform: the eight percentages are copied unchanged: O positive 36, O
 * negative 14, A positive 28, A negative 8, B positive 8, B negative 3, AB
 * positive 2, AB negative 1. They sum to exactly 100, so each is read as
 * donors in a hundred. The page's prose says "just 2%" for B negative, which
 * disagrees with its own list (3%); the list is used. The types are ordered
 * around the head so that the three smallest wedges sit apart and their
 * labels do not collide.
 */

/** One group's share of the whole, in units (donors in a hundred). */
export interface ShareDatum {
  label: string;
  value: number;
}

/** The blood types of a hundred donors, NHS Blood and Transplant, 2026. */
export const hundredFieldDemo: ShareDatum[] = [
  { label: "O positive", value: 36 },
  { label: "AB negative", value: 1 },
  { label: "A positive", value: 28 },
  { label: "B negative", value: 3 },
  { label: "O negative", value: 14 },
  { label: "AB positive", value: 2 },
  { label: "A negative", value: 8 },
  { label: "B positive", value: 8 },
];
