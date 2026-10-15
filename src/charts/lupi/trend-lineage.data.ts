/** One sea area's life: when it was added, changed, suspended or dropped. */
export interface LineageDatum {
  name: string;
  /** Year it was first added (fractions allowed: 2017.5 = mid-2017). */
  shipped: number;
  /** Years it was renamed, split or otherwise redrawn. */
  reworked?: number[];
  /** Spans when it sat out of use, drawn dotted. */
  dormant?: [number, number][];
  /** Year it was dropped from the forecast. Omit if it is still in use. */
  retired?: number;
}

/**
 * Ten shipping forecast sea areas, 1924 to today: when each was added,
 * renamed or redrawn, and (Tay) dropped. One row per area under its current
 * name; the years are those of the forecast chart, not of the name's first use
 * in the broadcast.
 *
 * Sources (fetched 2026-10-15; every year below is read from these):
 *  [FS] Met Office, National Meteorological Library and Archive, "Factsheet 8
 *       The Shipping Forecast" (PDF, text and Figures 3 to 8):
 *       https://www.metoffice.gov.uk/api/assets/file/factsheet_8_shipping_forecast_2025pdf?prefix=assets
 *       (linked from https://www.metoffice.gov.uk/research/library-and-archive/publications/factsheets)
 *  [MO] Met Office, "Tragedy and warnings: the origins of the shipping forecast":
 *       https://www.metoffice.gov.uk/about-us/who-we-are/our-history/tragedy-and-warnings-the-origins-of-the-shipping-forecast
 *  [RMG] Royal Museums Greenwich, "History of the Shipping Forecast" (2002 rename):
 *       https://www.rmg.co.uk/stories/maritime-history/shipping-forecast
 *
 * Rows:
 *  Forties: added 1924 (FS Figure 3 map; MO lists it among seven areas "with us
 *    since the very first Shipping Forecast transmission"); divided in 1956, its northern half named Viking
 *    (FS "these changes were introduced in 1956"; MO).
 *  Dogger: added 1924 (FS Figure 3; MO); divided in 1956, its north-eastern half
 *    named Fisher (FS; MO).
 *  Tay: on the 1924 map (FS Figure 3) and the 1932 map (FS Figure 4), absent from
 *    the chart adopted in 1949 (FS Figure 5; FS text: the earlier divisions
 *    "were omitted and 18 new names added"). The Met Office gives no day for the
 *    drop, so 1949 is the first chart without it.
 *  German Bight: first on the 1949 chart as Heligoland (FS Figure 5); renamed
 *    German Bight in 1956 (FS; MO).
 *  FitzRoy: first on the 1949 chart as Finisterre (FS Figure 5); renamed FitzRoy
 *    in February 2002 (FS; MO; RMG).
 *  Rockall: added 1949 (MO "In 1949, many new areas ... were added, including
 *    Rockall, Bailey and Fast Net"; FS Figure 5).
 *  Fisher and Viking: new in 1956 (FS; MO).
 *  North Utsire and South Utsire: introduced August 1984 (FS; MO).
 *
 * Left out because no fetched source supports them: the Minches merging into
 * Hebrides in 1983 (only Country Life and an uncited Wikipedia line say so, and
 * the Met Office's 1949 and 1956 to 1984 charts, FS Figures 5 and 6, show no
 * Minches area at all), and Viking being resized in 1984 (FS says only that
 * common North Sea boundaries were introduced that August).
 *
 * Transform: none beyond reading each year off the sources above.
 */
export const trendLineageDemo: LineageDatum[] = [
  { name: "Forties", reworked: [1956], shipped: 1924 },
  { name: "Dogger", reworked: [1956], shipped: 1924 },
  { name: "Tay", retired: 1949, shipped: 1924 },
  { name: "German Bight", reworked: [1956], shipped: 1949 },
  { name: "FitzRoy", reworked: [2002], shipped: 1949 },
  { name: "Rockall", shipped: 1949 },
  { name: "Fisher", shipped: 1956 },
  { name: "Viking", shipped: 1956 },
  { name: "North Utsire", shipped: 1984 },
  { name: "South Utsire", shipped: 1984 },
];
