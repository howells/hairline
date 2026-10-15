/** One part of a whole. */
export interface ShareDatum {
  label: string;
  value: number;
}

/**
 * F4 Where the bill goes. What the energy price cap allows for in a typical
 * annual dual fuel bill paid by Direct Debit, 1 October to 31 December 2025:
 * pounds a year, £1,755 in all.
 *
 * Source: Ofgem, "Energy price cap (default tariff) update from 1 October 2025",
 * letter of 27 August 2025, Annex 1 "Direct Debit Price Cap Cost Breakdown"
 * (a UK regulator's published letter), cap period 15a, typical domestic consumption
 * at medium level.
 *   https://www.ofgem.gov.uk/sites/default/files/2025-08/summary-of-changes-to-energy-price-cap-1-october-to-31-december-2025.pdf
 * Fetched 2026-10-15.
 *
 * Transform: wholesale (including contracts for difference) 720, networks
 * 396, operating, debt and industry costs 270, policy 215 and VAT 84 are the
 * October to December column as printed. "Other" adds the earnings before
 * interest and tax allowance (42), headroom (18) and levelisation
 * allowance (10): 70. The six parts add to 1755, the printed total.
 * Scripts: reference/scripts/F4/gen.py.
 */
export const tickDonutDemo: ShareDatum[] = [
  { label: "Wholesale", value: 720 },
  { label: "Networks", value: 396 },
  { label: "Operating", value: 270 },
  { label: "Policy", value: 215 },
  { label: "VAT", value: 84 },
  { label: "Other", value: 70 },
];
