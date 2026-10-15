/** A named point. */
export interface PlumbDatum {
  label: string;
  x: number;
  y: number;
}

/**
 * F8 Apple orchards. The twelve countries that grew the most apples in 2024
 * after China: the area of orchard harvested in thousands of hectares (x)
 * against the yield in tonnes a hectare (y). Chile gets 52.0 tonnes from 25.0
 * thousand hectares; India 8.6 tonnes from 304.1 thousand.
 *
 * Source: FAO, FAOSTAT, Crops and livestock products, bulk download
 * Production_Crops_Livestock_E_All_Data_(Normalized).csv (CC BY 4.0), item
 * Apples, year 2024, elements Production, Area harvested and Yield. Some
 * 2024 values are FAO estimates or imputed (flags E and I in the file).
 *   https://www.fao.org/faostat/en/#data/QCL
 *   https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).csv
 * Fetched 2026-10-15.
 *
 * Transform: drop regional aggregates (area codes of 5000 and above) and China
 * (2.09 million hectares, 24.5 tonnes a hectare), whose orchards are many times any other
 * and would squeeze the rest into the left edge. Rank countries by 2024
 * production and take the first twelve. Area is hectares divided by 1,000 and
 * yield kilograms a hectare divided by 1,000, each to one decimal. Names
 * shortened: United States, Russia, Iran. Scripts: reference/scripts/F8/gen.py.
 */
export const plumbScatterDemo: PlumbDatum[] = [
  { label: "United States", x: 121.2, y: 40.6 },
  { label: "Türkiye", x: 165.3, y: 26.7 },
  { label: "Poland", x: 148, y: 22.9 },
  { label: "India", x: 304.1, y: 8.6 },
  { label: "Italy", x: 53.4, y: 44.9 },
  { label: "Iran", x: 120.5, y: 19.5 },
  { label: "Russia", x: 189.9, y: 10.6 },
  { label: "France", x: 52.8, y: 37.2 },
  { label: "Uzbekistan", x: 123.8, y: 12 },
  { label: "South Africa", x: 31.1, y: 42.7 },
  { label: "Chile", x: 25, y: 52 },
  { label: "Ukraine", x: 76.3, y: 15.1 },
];
