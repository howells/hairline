/**
 * M2 Wine drinking: litres of pure alcohol from wine per adult, 2022.
 * Source: World Health Organization, Global Health Observatory, as published
 * by Our World in Data (CC BY 4.0), "Wine consumption per person",
 * https://ourworldindata.org/grapher/wine-consumption-per-capita
 * Fetched 2026-10-15.
 * File: wine-consumption-per-capita.csv (Entity, Code, Year, litres of pure
 * alcohol per person aged 15 and over). Transform: the Year = 2022 rows that
 * carry a country code (187), each value copied as it stands and joined to the
 * Natural Earth short names the polygons use. Eleven names differ and are
 * mapped by hand: Bosnia and Herzegovina, Central African Republic, Cote
 * d'Ivoire, Democratic Republic of Congo, Dominican Republic, Equatorial
 * Guinea, Solomon Islands, East Timor (Timor-Leste), United States (United
 * States of America), Eswatini (eSwatini), North Macedonia (Macedonia). 24
 * small states and islands in the file have no polygon at this scale and are
 * left out. 12 polygons have no value in the file and show as no data:
 * Falkland Is., Greenland, Kosovo, N. Cyprus, New Caledonia, Palestine,
 * Puerto Rico, S. Sudan, Saudi Arabia, Somaliland, Taiwan and W. Sahara. A
 * recorded 0 is a value, not a gap.
 */

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

/** Litres of pure alcohol from wine per person aged 15 and over, 2022, highest first. */
export const worldChoroplethDemo: CountryDatum[] = [
  { code: "PT", country: "Portugal", dx: -34, dy: 30, value: 6.79 },
  { code: "MD", country: "Moldova", value: 6.78 },
  { code: "FR", country: "France", dx: -18, dy: -36, value: 5.66 },
  { code: "IT", country: "Italy", dx: 30, dy: 30, value: 5.38 },
  { code: "LU", country: "Luxembourg", value: 4.455 },
  { code: "AU", country: "Australia", value: 4.44 },
  { code: "ES", country: "Spain", value: 4.31 },
  { code: "GE", country: "Georgia", value: 4.0188 },
  { code: "DK", country: "Denmark", value: 4.01 },
  { code: "CH", country: "Switzerland", value: 3.83 },
  { code: "SI", country: "Slovenia", value: 3.8 },
  { code: "AR", country: "Argentina", value: 3.7 },
  { country: "Namibia", value: 3.6288 },
  { country: "United Kingdom", value: 3.52 },
  { code: "AT", country: "Austria", value: 3.5 },
  { country: "Sweden", value: 3.44 },
  { country: "Romania", value: 3.33 },
  { country: "Croatia", value: 3.3084 },
  { code: "DE", country: "Germany", value: 3.25 },
  { country: "Czechia", value: 2.9447134 },
  { country: "Netherlands", value: 2.9 },
  { country: "Ireland", value: 2.86 },
  { country: "Greece", value: 2.8596 },
  { country: "Uruguay", value: 2.76 },
  { country: "Belgium", value: 2.5926087 },
  { country: "Norway", value: 2.52 },
  { country: "New Zealand", value: 2.47 },
  { country: "Hungary", value: 2.43 },
  { country: "Iceland", value: 2.23 },
  { country: "Slovakia", value: 2.14 },
  { country: "Estonia", value: 1.94 },
  { code: "CL", country: "Chile", value: 1.934417 },
  { country: "Canada", value: 1.92 },
  { country: "Macedonia", value: 1.788 },
  { country: "Bahamas", value: 1.7556 },
  { country: "United States of America", value: 1.59 },
  { country: "Albania", value: 1.5864 },
  { country: "Finland", value: 1.58 },
  { country: "Latvia", value: 1.57 },
  { country: "Cyprus", value: 1.47344 },
  { country: "Turkmenistan", value: 1.4328 },
  { country: "Lithuania", value: 1.39 },
  { country: "South Africa", value: 1.36 },
  { country: "Mongolia", value: 1.32 },
  { country: "Serbia", value: 1.2732 },
  { country: "Bulgaria", value: 1.23 },
  { country: "Guinea-Bissau", value: 1.1172 },
  { country: "Belarus", value: 0.97 },
  { country: "Russia", value: 0.94 },
  { country: "Poland", value: 0.89 },
  { country: "Montenegro", value: 0.864 },
  { country: "Eq. Guinea", value: 0.6973104 },
  { country: "Paraguay", value: 0.6276 },
  { country: "Belize", value: 0.5856 },
  { country: "Armenia", value: 0.54 },
  { country: "Bosnia and Herz.", value: 0.522 },
  { country: "Peru", value: 0.4512 },
  { country: "Botswana", value: 0.4356 },
  { country: "Côte d'Ivoire", value: 0.4356 },
  { country: "Gabon", value: 0.4356 },
  { country: "Tunisia", value: 0.3888 },
  { country: "Vanuatu", value: 0.3732 },
  { country: "Brazil", value: 0.3556339 },
  { country: "Japan", value: 0.35 },
  { country: "Turkey", value: 0.34 },
  { country: "Morocco", value: 0.27 },
  { country: "South Korea", value: 0.26 },
  { country: "United Arab Emirates", value: 0.2478795 },
  { country: "Jamaica", value: 0.24 },
  { country: "Suriname", value: 0.24 },
  { country: "Fiji", value: 0.2376 },
  { country: "Thailand", value: 0.22 },
  { country: "Ukraine", value: 0.21114847 },
  { country: "Cuba", value: 0.204 },
  { country: "Angola", value: 0.1932 },
  { country: "Costa Rica", value: 0.17747805 },
  { country: "Mexico", value: 0.17360736 },
  { country: "Kyrgyzstan", value: 0.16 },
  { country: "Qatar", value: 0.1493818 },
  { country: "Lebanon", value: 0.1488 },
  { country: "Burkina Faso", value: 0.1404 },
  { country: "Colombia", value: 0.135488 },
  { country: "Dominican Rep.", value: 0.13 },
  { country: "Bolivia", value: 0.1272 },
  { country: "Ecuador", value: 0.1272 },
  { country: "Uzbekistan", value: 0.1255647 },
  { country: "Azerbaijan", value: 0.12 },
  { country: "Lesotho", value: 0.12 },
  { country: "Algeria", value: 0.1128 },
  { country: "Kazakhstan", value: 0.11 },
  { country: "Malaysia", value: 0.1068 },
  { country: "Trinidad and Tobago", value: 0.1068 },
  { country: "Cameroon", value: 0.0864 },
  { country: "Congo", value: 0.0768 },
  { country: "Israel", value: 0.0708 },
  { country: "Senegal", value: 0.06757046 },
  { country: "El Salvador", value: 0.066 },
  { country: "eSwatini", value: 0.0624 },
  { country: "Guyana", value: 0.0624 },
  { country: "Madagascar", value: 0.0588 },
  { country: "Bhutan", value: 0.05555562 },
  { country: "Guatemala", value: 0.0504 },
  { country: "Papua New Guinea", value: 0.0492 },
  { country: "Ghana", value: 0.0468 },
  { country: "Panama", value: 0.0408 },
  { country: "Benin", value: 0.0372 },
  { country: "Laos", value: 0.0372 },
  { country: "Honduras", value: 0.0336 },
  { country: "Djibouti", value: 0.0312 },
  { country: "Liberia", value: 0.0312 },
  { country: "Nigeria", value: 0.0312 },
  { country: "Philippines", value: 0.0312 },
  { country: "China", value: 0.03 },
  { country: "Kenya", value: 0.03 },
  { country: "Zambia", value: 0.0288 },
  { country: "Haiti", value: 0.0276 },
  { country: "Nicaragua", value: 0.0276 },
  { country: "Solomon Is.", value: 0.0276 },
  { country: "Zimbabwe", value: 0.0276 },
  { country: "Rwanda", value: 0.0252 },
  { country: "Mali", value: 0.0192 },
  { country: "Oman", value: 0.017011095 },
  { country: "Central African Rep.", value: 0.0168 },
  { country: "Mozambique", value: 0.0156 },
  { country: "Venezuela", value: 0.0144 },
  { country: "Guinea", value: 0.0132 },
  { country: "Cambodia", value: 0.012 },
  { country: "Vietnam", value: 0.012 },
  { country: "Niger", value: 0.0096 },
  { country: "Tanzania", value: 0.0096 },
  { country: "Sri Lanka", value: 0.00849248 },
  { country: "Egypt", value: 0.0084 },
  { country: "Burundi", value: 0.0072 },
  { country: "Dem. Rep. Congo", value: 0.0072 },
  { country: "Sierra Leone", value: 0.0072 },
  { country: "Tajikistan", value: 0.0072 },
  { country: "Uganda", value: 0.006 },
  { country: "Iraq", value: 0.0048 },
  { country: "Jordan", value: 0.0048 },
  { country: "Nepal", value: 0.0036 },
  { country: "Chad", value: 0.0024 },
  { country: "India", value: 0.0024 },
  { country: "Malawi", value: 0.0024 },
  { country: "Ethiopia", value: 0.0012 },
  { country: "Indonesia", value: 0.0012 },
  { country: "Syria", value: 0.0012 },
  { country: "Afghanistan", value: 0 },
  { country: "Bangladesh", value: 0 },
  { country: "Brunei", value: 0 },
  { country: "Timor-Leste", value: 0 },
  { country: "Eritrea", value: 0 },
  { country: "Gambia", value: 0 },
  { country: "Iran", value: 0 },
  { country: "Kuwait", value: 0 },
  { country: "Libya", value: 0 },
  { country: "Mauritania", value: 0 },
  { country: "Myanmar", value: 0 },
  { country: "North Korea", value: 0 },
  { country: "Pakistan", value: 0 },
  { country: "Somalia", value: 0 },
  { country: "Sudan", value: 0 },
  { country: "Togo", value: 0 },
  { country: "Yemen", value: 0 },
];
