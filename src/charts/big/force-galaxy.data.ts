/**
 * B2 Lines and stations: each Underground line a hub, its busiest stations
 * round it, and the interchanges that tie the lines together.
 * Sources: Transport for London, annual station counts 2025,
 * https://crowding.data.tfl.gov.uk/ (Annual Station Counts/2025/
 * AC2025_AnnualisedEntryExit_public.xlsx, "Annualised En/Ex", entries plus
 * exits in millions a year, TfL open data), and the TfL Unified API,
 * https://api.tfl.gov.uk/Line/{id}/StopPoints for which lines serve which
 * station (type NaptanMetroStation). Both fetched 2026-10-15.
 * Transform: eight lines (Bakerloo, Central, District, Jubilee, Metropolitan,
 * Northern, Piccadilly, Victoria; Circle, Hammersmith and City, and Waterloo
 * and City are left out as they share nearly all their stations with the
 * others). Station names are joined to the count rows by name, with these
 * by-hand matches: Bank and Monument are one complex and one node; St. Paul's,
 * St. James's Park and St. John's Wood lose the full stop; Edgware Road
 * (Bakerloo) is "Edgware Road (Bak)" and Edgware Road (Circle Line) is
 * "Edgware Road (DIS)"; Hammersmith (Dist&Picc Line) is "Hammersmith (DIS)";
 * Heathrow Terminals 2 and 3 is "Heathrow Terminals 123 LU"; the rest of the
 * "LU" and "TfL" suffixes are dropped. Kensington (Olympia) has no count
 * ("---") and is left out. A station is kept if its count is at least 5
 * million. It hangs from the line it serves that has the fewest stations,
 * and also calls the hub of every other line that serves it. A hub's volume
 * is the sum over all its stations (interchanges count once for each line).
 * Hub-to-hub weight is the number of stations two lines share: 1 to 2 is 1,
 * 3 to 4 is 2, 5 or more is 3. The station "Victoria" is renamed "Victoria
 * station" so it differs from the Victoria line.
 */

export interface GalaxyNode {
  /** Group (cluster) the node belongs to. */
  domain: string;
  /** The group's hub: labelled, larger, anchors its satellites. */
  hub?: boolean;
  id: string;
  /** Size measure, e.g. entries and exits a year. Drives the dot area. */
  volume: number;
}

export interface GalaxyLink {
  source: string;
  target: string;
  /** Relative strength; drives the hub-to-hub line weight. */
  weight?: number;
}

export interface GalaxyData {
  links: GalaxyLink[];
  nodes: GalaxyNode[];
}

const HUBS: [string, number][] = [
  ["Northern", 683.1],
  ["District", 612.3],
  ["Central", 514.3],
  ["Jubilee", 465],
  ["Piccadilly", 421.3],
  ["Victoria", 403.6],
  ["Metropolitan", 332.3],
  ["Bakerloo", 331.8],
];

const STATIONS: [string, string, number][] = [
  ["Bakerloo", "Waterloo", 74.48],
  ["Bakerloo", "Paddington", 57.97],
  ["Bakerloo", "Piccadilly Circus", 24.04],
  ["Bakerloo", "Baker Street", 22.39],
  ["Bakerloo", "Embankment", 17.94],
  ["Bakerloo", "Charing Cross", 14.71],
  ["Bakerloo", "Elephant & Castle", 12.99],
  ["Bakerloo", "Marylebone", 8.33],
  ["Bakerloo", "Harrow & Wealdstone", 5.4],
  ["Central", "Tottenham Court Road", 60.81],
  ["Central", "Bank and Monument", 41.12],
  ["Central", "Holborn", 19.09],
  ["Central", "Ealing Broadway", 17.23],
  ["Central", "Shepherd's Bush", 12.54],
  ["Central", "Notting Hill Gate", 12.5],
  ["Central", "Mile End", 10.74],
  ["Central", "Bethnal Green", 9.21],
  ["Central", "St Paul's", 8.85],
  ["Central", "Leyton", 8.4],
  ["Central", "Marble Arch", 8.38],
  ["Central", "Chancery Lane", 8.04],
  ["Central", "White City", 7.95],
  ["Central", "Leytonstone", 6.65],
  ["Central", "Queensway", 5.82],
  ["Central", "North Acton", 5.74],
  ["District", "Whitechapel", 17.89],
  ["District", "Barking", 17.41],
  ["District", "Wimbledon", 16.9],
  ["District", "Tower Hill", 16.1],
  ["District", "Sloane Square", 14.69],
  ["District", "Richmond", 12.43],
  ["District", "Aldgate East", 11.61],
  ["District", "Upton Park", 11.29],
  ["District", "Blackfriars", 10.71],
  ["District", "East Ham", 10.69],
  ["District", "St James's Park", 9.84],
  ["District", "High Street Kensington", 9.61],
  ["District", "Temple", 8.38],
  ["District", "Fulham Broadway", 6.75],
  ["District", "Edgware Road (DIS)", 6.06],
  ["District", "East Putney", 5.67],
  ["District", "Parsons Green", 5.44],
  ["District", "West Brompton", 5.26],
  ["District", "Stepney Green", 5.03],
  ["Jubilee", "London Bridge", 56.19],
  ["Jubilee", "Stratford", 53.19],
  ["Jubilee", "Bond Street", 42.3],
  ["Jubilee", "Canary Wharf", 32.55],
  ["Jubilee", "North Greenwich", 23.18],
  ["Jubilee", "Westminster", 18.56],
  ["Jubilee", "Wembley Park", 15.55],
  ["Jubilee", "Canning Town", 11.91],
  ["Jubilee", "Canada Water", 9.64],
  ["Jubilee", "Southwark", 8.58],
  ["Jubilee", "West Hampstead", 8.1],
  ["Jubilee", "Finchley Road", 7.28],
  ["Jubilee", "Bermondsey", 7.04],
  ["Jubilee", "St John's Wood", 6.19],
  ["Jubilee", "Willesden Green", 5.44],
  ["Jubilee", "Swiss Cottage", 5.43],
  ["Jubilee", "West Ham", 5.22],
  ["Jubilee", "Kilburn", 5.15],
  ["Metropolitan", "Liverpool Street", 60.08],
  ["Metropolitan", "Farringdon", 42.03],
  ["Metropolitan", "Moorgate", 27.15],
  ["Metropolitan", "Euston Square", 12.19],
  ["Metropolitan", "Harrow-on-the-Hill", 8.49],
  ["Metropolitan", "Aldgate", 6.88],
  ["Metropolitan", "Great Portland Street", 5.68],
  ["Metropolitan", "Barbican", 5.34],
  ["Northern", "Leicester Square", 26.34],
  ["Northern", "Camden Town", 17.16],
  ["Northern", "Old Street", 15.26],
  ["Northern", "Tooting Broadway", 11.89],
  ["Northern", "Angel", 11.69],
  ["Northern", "Balham", 9.88],
  ["Northern", "Battersea Power Station", 8.62],
  ["Northern", "Morden", 8.3],
  ["Northern", "Clapham Common", 7.45],
  ["Northern", "Archway", 6.78],
  ["Northern", "Kentish Town", 6.37],
  ["Northern", "Tooting Bec", 6.31],
  ["Northern", "Clapham South", 6.12],
  ["Northern", "Golders Green", 5.92],
  ["Northern", "Colindale", 5.41],
  ["Northern", "East Finchley", 5.31],
  ["Northern", "Colliers Wood", 5.24],
  ["Northern", "Belsize Park", 5.09],
  ["Northern", "Goodge Street", 5.06],
  ["Piccadilly", "South Kensington", 27.83],
  ["Piccadilly", "Hammersmith (DIS)", 20.68],
  ["Piccadilly", "Earl's Court", 15.54],
  ["Piccadilly", "Knightsbridge", 13.17],
  ["Piccadilly", "Covent Garden", 11.51],
  ["Piccadilly", "Gloucester Road", 11.5],
  ["Piccadilly", "Russell Square", 8.29],
  ["Piccadilly", "Wood Green", 8.03],
  ["Piccadilly", "Turnpike Lane", 7.48],
  ["Piccadilly", "Barons Court", 5.43],
  ["Piccadilly", "Manor House", 5.4],
  ["Piccadilly", "Heathrow Terminals 123", 5.38],
  ["Victoria", "King's Cross St. Pancras", 73.57],
  ["Victoria", "Victoria station", 60.16],
  ["Victoria", "Oxford Circus", 52.34],
  ["Victoria", "Euston", 33.31],
  ["Victoria", "Green Park", 29.61],
  ["Victoria", "Vauxhall", 21.95],
  ["Victoria", "Finsbury Park", 20.98],
  ["Victoria", "Brixton", 20.27],
  ["Victoria", "Highbury & Islington", 14.77],
  ["Victoria", "Tottenham Hale", 13.98],
  ["Victoria", "Warren Street", 13.85],
  ["Victoria", "Walthamstow Central", 13.02],
  ["Victoria", "Seven Sisters", 11.86],
  ["Victoria", "Blackhorse Road", 9.01],
  ["Victoria", "Pimlico", 7.64],
  ["Victoria", "Stockwell", 7.29],
];

/** A station that another line also serves: [station, that line's hub]. */
const CALLS: [string, string][] = [
  ["Waterloo", "Jubilee"],
  ["Waterloo", "Northern"],
  ["Paddington", "District"],
  ["Piccadilly Circus", "Piccadilly"],
  ["Baker Street", "Jubilee"],
  ["Baker Street", "Metropolitan"],
  ["Embankment", "District"],
  ["Embankment", "Northern"],
  ["Charing Cross", "Northern"],
  ["Elephant & Castle", "Northern"],
  ["Tottenham Court Road", "Northern"],
  ["Bank and Monument", "District"],
  ["Bank and Monument", "Northern"],
  ["Holborn", "Piccadilly"],
  ["Ealing Broadway", "District"],
  ["Notting Hill Gate", "District"],
  ["Mile End", "District"],
  ["London Bridge", "Northern"],
  ["Stratford", "Central"],
  ["Bond Street", "Central"],
  ["Westminster", "District"],
  ["Wembley Park", "Metropolitan"],
  ["Finchley Road", "Metropolitan"],
  ["Willesden Green", "Metropolitan"],
  ["West Ham", "District"],
  ["Liverpool Street", "Central"],
  ["Moorgate", "Northern"],
  ["Leicester Square", "Piccadilly"],
  ["South Kensington", "District"],
  ["Hammersmith (DIS)", "District"],
  ["Earl's Court", "District"],
  ["Gloucester Road", "District"],
  ["Barons Court", "District"],
  ["King's Cross St. Pancras", "Metropolitan"],
  ["King's Cross St. Pancras", "Northern"],
  ["King's Cross St. Pancras", "Piccadilly"],
  ["Victoria station", "District"],
  ["Oxford Circus", "Bakerloo"],
  ["Oxford Circus", "Central"],
  ["Euston", "Northern"],
  ["Green Park", "Jubilee"],
  ["Green Park", "Piccadilly"],
  ["Finsbury Park", "Piccadilly"],
  ["Warren Street", "Northern"],
  ["Stockwell", "Northern"],
];

/** Pairs of lines that share stations: [line, line, line weight 1 to 3]. */
const MESH: [string, string, number][] = [
  ["Bakerloo", "Central", 1],
  ["Bakerloo", "District", 1],
  ["Bakerloo", "Jubilee", 1],
  ["Bakerloo", "Metropolitan", 1],
  ["Bakerloo", "Northern", 2],
  ["Bakerloo", "Piccadilly", 1],
  ["Bakerloo", "Victoria", 1],
  ["Central", "District", 2],
  ["Central", "Jubilee", 1],
  ["Central", "Metropolitan", 1],
  ["Central", "Northern", 1],
  ["Central", "Piccadilly", 1],
  ["Central", "Victoria", 1],
  ["District", "Jubilee", 1],
  ["District", "Northern", 1],
  ["District", "Piccadilly", 3],
  ["District", "Victoria", 1],
  ["Jubilee", "Metropolitan", 2],
  ["Jubilee", "Northern", 1],
  ["Jubilee", "Piccadilly", 1],
  ["Jubilee", "Victoria", 1],
  ["Metropolitan", "Northern", 1],
  ["Metropolitan", "Piccadilly", 3],
  ["Metropolitan", "Victoria", 1],
  ["Northern", "Piccadilly", 1],
  ["Northern", "Victoria", 2],
  ["Piccadilly", "Victoria", 2],
];

/** Eight Underground lines, each with the stations of 5 million or more entries and exits a year. */
export const forceGalaxyDemo: GalaxyData = (() => {
  const nodes: GalaxyNode[] = [];
  const links: GalaxyLink[] = [];
  for (const [name, volume] of HUBS) {
    nodes.push({ domain: name, hub: true, id: name, volume });
  }
  for (const [line, id, volume] of STATIONS) {
    nodes.push({ domain: line, id, volume });
    links.push({ source: line, target: id, weight: 1 });
  }
  for (const [a, b, weight] of MESH) {
    links.push({ source: a, target: b, weight });
  }
  for (const [id, line] of CALLS) {
    links.push({ source: id, target: line, weight: 0.5 });
  }
  return { links, nodes };
})();
