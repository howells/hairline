/**
 * L12 Lights by keeper: the working lighthouses of England, by who keeps them.
 *
 * Source: Wikipedia, "List of lighthouses in England", the table of lighthouses
 * (name, county, year built, operator). The page's NGA numbers refer to the US
 * National Geospatial-Intelligence Agency's List of Lights.
 * Page: https://en.wikipedia.org/wiki/List_of_lighthouses_in_England
 * Fetched 2026-10-15.
 *
 * Transform: all 84 rows of the first table. The operator is the one named in
 * the Operator column; where a cell names a change of hands the operator
 * "from" the later date is the current one (Guile Point East: Trinity House;
 * Happisburgh: Happisburgh Lighthouse Trust; Maryport New: Maryport Harbour
 * Authority; Plymouth Breakwater: Ministry of Defence). Flamborough Head lists
 * Trinity House and East Riding of Yorkshire Council together with no dates,
 * so it is left out, leaving 83. Operators are grouped into keepers: Trinity
 * House (43), Harbours (34: harbour boards and commissions, port companies
 * and authorities, Gloucester Harbour Trustees, Watchet Marina, Associated
 * British Ports), Councils (4: North Yorkshire, Somerset), Trust (1:
 * Happisburgh Lighthouse Trust) and Defence (1: the Ministry of Defence).
 * Lights are listed alphabetically.
 * Script: reference/scripts/L12/keepers.py (and parse.py).
 */

/** One owned thing and who owns it. */
export interface OwnershipDatum {
  name: string;
  owner: string;
}

/** Lights by the body that keeps them. */
const owned: [string, string[]][] = [
  [
    "Trinity House",
    [
      "Anvil Point Lighthouse",
      "Bamburgh Lighthouse",
      "Beachy Head Lighthouse",
      "Berry Head Lighthouse",
      "Bishop Rock Lighthouse",
      "Bull Point Lighthouse",
      "Coquet Lighthouse",
      "Cromer Lighthouse",
      "Crow Point Lighthouse",
      "Dungeness Lighthouse",
      "Eddystone Lighthouse",
      "Farne Lighthouse",
      "Godrevy Lighthouse",
      "Guile Point East Lighthouse",
      "Hartland Point Lighthouse",
      "Heugh Hill Lighthouse",
      "Hilbre Island Lighthouse",
      "Hurst Point Lighthouse",
      "Instow Front Lighthouse",
      "Instow Rear Lighthouse",
      "Lizard Lighthouse",
      "Longships Lighthouse",
      "Longstone Lighthouse",
      "Lowestoft Lighthouse",
      "Lundy North Lighthouse",
      "Lundy South Lighthouse",
      "Lynmouth Foreland Lighthouse",
      "Nab Tower",
      "Needles Lighthouse",
      "North Foreland Lighthouse",
      "Pendeen Lighthouse",
      "Peninnis Lighthouse",
      "Portland Bill Lighthouse",
      "Round Island Lighthouse",
      "Southwold Lighthouse",
      "St Anthony's Lighthouse",
      "St Bees Lighthouse",
      "St. Catherine's Lighthouse",
      "Start Point Lighthouse",
      "Tater Du Lighthouse",
      "Trevose Head Lighthouse",
      "Whitby Lighthouse",
      "Wolf Rock Lighthouse",
    ],
  ],
  [
    "Harbours",
    [
      "Beach Lighthouse",
      "Berkeley Pill Front light",
      "Berkeley Pill Rear light",
      "Berwick Lighthouse",
      "Chapel Rock Lighthouse",
      "Folkestone Lighthouse",
      "Gorleston South Pier Lighthouse",
      "Herd Groyne Light",
      "Heugh Lighthouse",
      "Ilfracombe Lighthouse",
      "Killingholme High Lighthouse",
      "Killingholme South Low Lighthouse",
      "Lyde Rock lighthouse",
      "Maryport New Lighthouse",
      "Pharos Lighthouse",
      "Plover Scar Lighthouse",
      "Portishead Point Lighthouse",
      "Portland Breakwater Lighthouse",
      "Rampside Lighthouse",
      "Ramsgate West Pier Lighthouse",
      "Roker Pier lighthouse",
      "Shoreham Lighthouse",
      "South Gare Lighthouse",
      "Teignmouth Lighthouse",
      "Thorngumbald Clough High Lighthouse",
      "Thorngumbald Clough Low Lighthouse",
      "Tyne South Pier light",
      "Tynemouth North Pier light",
      "Walney Lighthouse",
      "Watchet Harbour Lighthouse",
      "West Pier Lighthouse",
      "Whitby East Pier Lighthouse",
      "Whitby West Pier Lighthouse",
      "Whitgift Lighthouse",
    ],
  ],
  [
    "Councils",
    [
      "Burnham-on-Sea Low Lighthouse",
      "Scarborough Lighthouse",
      "Whitby East Pier beacon",
      "Whitby West Pier beacon",
    ],
  ],
  ["Trust", ["Happisburgh Lighthouse"]],
  ["Defence", ["Plymouth Breakwater Lighthouse"]],
];

/** 83 lights, listed alphabetically by name. */
export const typeColonnadeDemo: OwnershipDatum[] = owned
  .flatMap(([owner, lights]) => lights.map((name) => ({ name, owner })))
  .toSorted((a, b) => a.name.localeCompare(b.name));
