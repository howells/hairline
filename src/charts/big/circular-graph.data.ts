/**
 * B1 Land borders: the countries with five or more land neighbours, round a
 * ring by continent, linked by the length of border they share.
 * Source: CIA, The World Factbook, country profiles, Geography, "Land
 * boundaries: border countries" (public domain). The CIA took the Factbook
 * offline in February 2026; the profiles were fetched on 2026-10-15 from the
 * factbook.json mirror, https://github.com/factbook/factbook.json (one JSON
 * file per country, a verbatim copy of the profile text), 252 files.
 * Transform: each "Name 1,234 km" entry in a profile's border list is one
 * reported length; entries for the same neighbour are summed (China-Russia is
 * 4,133 + 46 km). Territories and dependencies are left out (French Guiana,
 * Gaza Strip, West Bank, Gibraltar, Hong Kong, Macau, Western Sahara, Saint
 * Martin, Sint Maarten, the Guantanamo Bay base, Akrotiri and Dhekelia,
 * Greenland); so is the European Union's profile. Where both countries report
 * the border and differ (Israel-Jordan 327 and 307, Germany-Poland 447 and
 * 467, Mexico-United States 3,155 and 3,111) the larger is kept; one pair is
 * reported by one side only (Denmark's profile lists Canada, 1.3 km, a pair
 * outside the countries shown). 156
 * countries have a land border; the 57 with five or more neighbours are
 * shown, with 105 borders among them. A node's size is its number of land
 * neighbours counting the countries not shown. Continent is assigned by hand
 * (Russia in Europe; Turkey, Azerbaijan and Kazakhstan in Asia; the Middle
 * East, Central, South and East Asia together as Asia).
 * Names are the Factbook's short forms; the Central African Republic's is
 * missing there and is written out, and "Cote d'Ivoire" takes its accent.
 */

export interface RingNode {
  /** Group the node belongs to; groups sit together on the ring. */
  group: string;
  /** Unique id, also the label, e.g. "Germany". */
  id: string;
  /** Size measure (land neighbours); drives the dot area. */
  size: number;
}

export interface RingLink {
  source: string;
  target: string;
  /** Length of the border the two countries share, in km. */
  weight: number;
}

export interface RingData {
  links: RingLink[];
  nodes: RingNode[];
}

const COUNTRIES: [string, string, number][] = [
  ["Africa", "DRC", 9],
  ["Africa", "Tanzania", 8],
  ["Africa", "Zambia", 8],
  ["Africa", "Mali", 7],
  ["Africa", "Niger", 7],
  ["Africa", "Sudan", 7],
  ["Africa", "Algeria", 6],
  ["Africa", "Burkina Faso", 6],
  ["Africa", "Cameroon", 6],
  ["Africa", "Central African Republic", 6],
  ["Africa", "Chad", 6],
  ["Africa", "Ethiopia", 6],
  ["Africa", "Guinea", 6],
  ["Africa", "Libya", 6],
  ["Africa", "Mozambique", 6],
  ["Africa", "South Africa", 6],
  ["Africa", "South Sudan", 6],
  ["Africa", "Congo (Brazzaville)", 5],
  ["Africa", "Côte d'Ivoire", 5],
  ["Africa", "Kenya", 5],
  ["Africa", "Senegal", 5],
  ["Africa", "Uganda", 5],
  ["Asia", "China", 14],
  ["Asia", "Turkey", 8],
  ["Asia", "Iran", 7],
  ["Asia", "Saudi Arabia", 7],
  ["Asia", "Afghanistan", 6],
  ["Asia", "India", 6],
  ["Asia", "Iraq", 6],
  ["Asia", "Azerbaijan", 5],
  ["Asia", "Burma", 5],
  ["Asia", "Kazakhstan", 5],
  ["Asia", "Laos", 5],
  ["Asia", "Syria", 5],
  ["Asia", "Uzbekistan", 5],
  ["Europe", "Russia", 14],
  ["Europe", "Germany", 9],
  ["Europe", "Austria", 8],
  ["Europe", "France", 8],
  ["Europe", "Serbia", 8],
  ["Europe", "Hungary", 7],
  ["Europe", "Poland", 7],
  ["Europe", "Ukraine", 7],
  ["Europe", "Italy", 6],
  ["Europe", "Belarus", 5],
  ["Europe", "Bulgaria", 5],
  ["Europe", "Croatia", 5],
  ["Europe", "Montenegro", 5],
  ["Europe", "North Macedonia", 5],
  ["Europe", "Romania", 5],
  ["Europe", "Slovakia", 5],
  ["Europe", "Switzerland", 5],
  ["South America", "Brazil", 9],
  ["South America", "Argentina", 5],
  ["South America", "Bolivia", 5],
  ["South America", "Colombia", 5],
  ["South America", "Peru", 5],
];

const BORDERS: [string, string, number][] = [
  ["Kazakhstan", "Russia", 7644],
  ["China", "Russia", 4179],
  ["Bolivia", "Brazil", 3403],
  ["China", "India", 2659],
  ["Brazil", "Peru", 2659],
  ["DRC", "Zambia", 2332],
  ["Kazakhstan", "Uzbekistan", 2330],
  ["South Sudan", "Sudan", 2158],
  ["Burma", "China", 2129],
  ["Russia", "Ukraine", 1944],
  ["Brazil", "Colombia", 1790],
  ["Congo (Brazzaville)", "DRC", 1775],
  ["China", "Kazakhstan", 1765],
  ["DRC", "Central African Republic", 1747],
  ["Iran", "Iraq", 1599],
  ["Chad", "Central African Republic", 1556],
  ["Colombia", "Peru", 1494],
  ["Burma", "India", 1468],
  ["Chad", "Sudan", 1403],
  ["Algeria", "Mali", 1359],
  ["Mali", "Burkina Faso", 1325],
  ["Belarus", "Russia", 1312],
  ["Ethiopia", "South Sudan", 1299],
  ["Argentina", "Brazil", 1263],
  ["Bolivia", "Peru", 1212],
  ["Chad", "Niger", 1196],
  ["Chad", "Cameroon", 1116],
  ["Belarus", "Ukraine", 1111],
  ["Guinea", "Mali", 1062],
  ["Central African Republic", "South Sudan", 1055],
  ["Chad", "Libya", 1050],
  ["Algeria", "Libya", 989],
  ["Algeria", "Niger", 951],
  ["Argentina", "Bolivia", 942],
  ["Afghanistan", "Iran", 921],
  ["Cameroon", "Central African Republic", 901],
  ["Syria", "Turkey", 899],
  ["DRC", "Uganda", 877],
  ["Ethiopia", "Kenya", 867],
  ["Mozambique", "Tanzania", 840],
  ["Mali", "Niger", 838],
  ["Guinea", "Côte d'Ivoire", 816],
  ["Kenya", "Uganda", 814],
  ["Iraq", "Saudi Arabia", 811],
  ["Austria", "Germany", 801],
  ["Kenya", "Tanzania", 775],
  ["Ethiopia", "Sudan", 744],
  ["DRC", "South Sudan", 714],
  ["Italy", "Switzerland", 698],
  ["Azerbaijan", "Iran", 689],
  ["Hungary", "Slovakia", 627],
  ["Niger", "Burkina Faso", 622],
  ["Bulgaria", "Romania", 605],
  ["Romania", "Ukraine", 601],
  ["Iraq", "Syria", 599],
  ["Côte d'Ivoire", "Mali", 599],
  ["Côte d'Ivoire", "Burkina Faso", 545],
  ["Iran", "Turkey", 534],
  ["Serbia", "Romania", 531],
  ["France", "Switzerland", 525],
  ["Slovakia", "Poland", 517],
  ["Poland", "Ukraine", 498],
  ["Mozambique", "South Africa", 496],
  ["Congo (Brazzaville)", "Cameroon", 494],
  ["Mali", "Senegal", 489],
  ["Congo (Brazzaville)", "Central African Republic", 487],
  ["DRC", "Tanzania", 479],
  ["France", "Italy", 476],
  ["China", "Laos", 475],
  ["South Sudan", "Uganda", 475],
  ["Germany", "Poland", 467],
  ["Mozambique", "Zambia", 439],
  ["Hungary", "Romania", 424],
  ["France", "Germany", 418],
  ["Austria", "Italy", 404],
  ["Tanzania", "Uganda", 391],
  ["Libya", "Sudan", 382],
  ["Belarus", "Poland", 375],
  ["Iraq", "Turkey", 367],
  ["Guinea", "Senegal", 363],
  ["Tanzania", "Zambia", 353],
  ["Croatia", "Hungary", 348],
  ["Germany", "Switzerland", 348],
  ["Bulgaria", "Serbia", 344],
  ["Libya", "Niger", 342],
  ["Azerbaijan", "Russia", 338],
  ["Austria", "Hungary", 321],
  ["Kenya", "South Sudan", 317],
  ["Croatia", "Serbia", 314],
  ["Burma", "Laos", 238],
  ["Bulgaria", "Turkey", 223],
  ["Poland", "Russia", 209],
  ["Central African Republic", "Sudan", 174],
  ["Hungary", "Serbia", 164],
  ["Bulgaria", "North Macedonia", 162],
  ["Austria", "Switzerland", 158],
  ["Montenegro", "Serbia", 157],
  ["Afghanistan", "Uzbekistan", 144],
  ["Hungary", "Ukraine", 128],
  ["Austria", "Slovakia", 105],
  ["North Macedonia", "Serbia", 101],
  ["Slovakia", "Ukraine", 97],
  ["Afghanistan", "China", 91],
  ["Croatia", "Montenegro", 19],
  ["Azerbaijan", "Turkey", 17],
];

/** The 57 countries with five or more land neighbours; a link is the length of border they share. */
export const circularGraphDemo: RingData = {
  links: BORDERS.map(([source, target, weight]) => ({
    source,
    target,
    weight,
  })),
  nodes: COUNTRIES.map(([group, id, size]) => ({ group, id, size })),
};
