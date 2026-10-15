/** Progress toward a target, in any unit. */
export interface TickGaugeDatum {
  target: number;
  value: number;
}

/**
 * F11 Rain so far. Rain recorded at Oxford (Radcliffe Observatory) from January
 * to September 2026, in millimetres (242.6), against the average annual total
 * for 1991 to 2020 (681.4). Months from January 2026 are provisional and
 * many readings are marked as estimates in the file.
 *
 * Source: Met Office historic station data, Oxford, monthly (Open Government
 * Licence v3.0). Station at 51.761 N, 1.262 W, 63 m.
 *   https://www.metoffice.gov.uk/research/climate/maps-and-data/historic-station-data
 *   https://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/oxforddata.txt
 * Fetched 2026-10-15.
 *
 * Transform: value = the sum of the "rain" column for the 9 months of 2026 in
 * the file (January to month 9). target = the mean over 1991 to 2020 of each
 * year's sum of the 12 monthly "rain" values (all 360 months present), computed
 * here rather than quoted from a Met Office average. Asterisks marking estimates
 * are ignored. Scripts: reference/scripts/F11/gen.py.
 */
export const tickGaugeDemo: TickGaugeDatum = {
  target: 681.4,
  value: 242.6,
};
