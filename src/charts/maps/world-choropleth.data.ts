import countriesTopo from "world-atlas/countries-110m.json";

import { regionsFrom } from "./geo";
import type { Region } from "./geo";

const POLAR = new Set(["Antarctica", "Fr. S. Antarctic Lands"]);

/** Every country except the Antarctic ones, keyed by Natural Earth short name, from world-atlas countries-110m. */
export const worldCountries: Region[] = regionsFrom(
  countriesTopo,
  "countries",
  (_, name) => name
).filter((r) => !POLAR.has(r.name));

export interface CountryDatum {
  /** Short code printed on the map when labelled. */
  code?: string;
  /** Natural Earth short name, as in world-atlas ("United States of America", "Dem. Rep. Congo"). */
  country: string;
  /** Label offset from the country's centre in px, drawn with a leader. */
  dx?: number;
  dy?: number;
  value: number;
}

/** Fieldnote monthly active accounts by country, end of 2026; markets not listed are unopened. */
export const worldChoroplethDemo: CountryDatum[] = [
  { code: "US", country: "United States of America", value: 128_400 },
  { code: "UK", country: "United Kingdom", dx: -26, dy: -16, value: 46_300 },
  { code: "DE", country: "Germany", dx: 22, dy: 18, value: 37_600 },
  { code: "IN", country: "India", value: 34_200 },
  { code: "CA", country: "Canada", value: 27_400 },
  { code: "FR", country: "France", value: 24_800 },
  { code: "BR", country: "Brazil", value: 21_700 },
  { code: "JP", country: "Japan", value: 19_300 },
  { code: "AU", country: "Australia", value: 17_600 },
  { code: "NL", country: "Netherlands", value: 12_900 },
  { code: "SE", country: "Sweden", value: 9800 },
  { code: "KR", country: "South Korea", value: 8700 },
  { code: "MX", country: "Mexico", value: 7400 },
  { code: "NG", country: "Nigeria", value: 3900 },
  { code: "KE", country: "Kenya", value: 2600 },
];
