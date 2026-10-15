/**
 * G4 Pollen in honey: which plant families the pollen in UK honey came from,
 * 2019. One square is one per cent of the DNA reads.
 *
 * Source: Woodcock, B.A., Oliver, A.E., Newbold, L.K., Gweon, H.S., Roy, D.B.
 * and Pywell, R.F. (2022), "Data describing pollen identified from honey
 * samples originating from the UKCEH National Honey Monitoring Scheme for
 * 2019", NERC EDS Environmental Information Data Centre,
 * https://doi.org/10.5285/e9ec63be-3f2b-4d1b-b9bf-77ca2b96c7f5 . Licence: Open
 * Government Licence v3; "Contains data supplied by UK Centre for Ecology &
 * Hydrology." Files data/nhms-2019-regional-data.csv and data/taxonomy.csv,
 * fetched 2026-10-15 from
 * https://data-package.ceh.ac.uk/data/e9ec63be-3f2b-4d1b-b9bf-77ca2b96c7f5.zip
 *
 * Transform: each of the 12 regional rows gives the average rarefied DNA reads
 * of pollen per plant species (every row sums to about 15,000). The reads of
 * each species were added over the 12 rows (equal weight per region, 180,566
 * reads in all), grouped by Family from taxonomy.csv, and turned into shares.
 * The four largest families are kept and the rest is "Everything else":
 * Rosaceae 23.6, Brassicaceae 20.5, Fabaceae 16.1, Boraginaceae 7.9 and the
 * remaining 31.9, which add up to 100.0. The names are the common names of
 * the families (rose, cabbage, pea, borage). Reads count DNA, not grains or
 * weight of pollen.
 */

export interface WaffleDatum {
  label: string;
  /** Share of pollen DNA reads, %. */
  value: number;
}

/** Share of the pollen DNA reads in UK honey, 2019, by plant family, %. */
export const dotWaffleDemo: WaffleDatum[] = [
  { label: "Rose family", value: 23.6 },
  { label: "Cabbage family", value: 20.5 },
  { label: "Pea family", value: 16.1 },
  { label: "Borage family", value: 7.9 },
  { label: "Everything else", value: 31.9 },
];
