/**
 * G6 Moving between regions: the nine regions of England, node size the moves
 * in and out of each, links the moves between each pair, year ending June 2025.
 *
 * Source: Office for National Statistics, "Internal migration in England and
 * Wales", moves by local authorities and regions by age and sex including
 * origin and destination, year ending June 2025 (2023 local authority
 * boundaries), Open Government Licence v3.0:
 * https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/internalmigrationinenglandandwales
 * File: internalmigration2025tables.xlsx, fetched 2026-10-15 from
 * https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/internalmigrationinenglandandwales/movesbylocalauthoritiesandregionsbyageandsexincludingoriginanddestinationmovesyearendingjune20252023localauthorityboundaries/internalmigration2025tables.xlsx
 *
 * The region Yorkshire and The Humber is shortened to Yorkshire so the ring's
 * names fit a phone.
 *
 * Transform: node value is Inflow plus Outflow for each English region from
 * sheet IM2025-T5 (moves with every other part of England and Wales,
 * including Wales), in thousands, rounded. Link value comes from sheet
 * IM2025-T6, a square matrix of moves with rows the destination and columns
 * the origin: for two regions it is the cell each way added together, in
 * thousands, rounded. The 36 pairs of English regions were ranked and the
 * twenty largest kept; the cut falls at North East and Yorkshire and The
 * Humber (33,917 moves), which keeps every region linked. London and the
 * South East swap 243,035 moves, the most of any pair; London lost 131,961
 * more people to the rest of England and Wales than it gained.
 */

export interface CircleNode {
  id: string;
  /** Moves in and out, thousands. */
  value: number;
}

export interface CircleLink {
  source: string;
  target: string;
  /** Moves between the two regions, both ways, thousands. */
  value: number;
}

export interface CircleGraphData {
  nodes: CircleNode[];
  links: CircleLink[];
}

/** Moves between English regions in the year to June 2025. */
export const circularGraphDemo: CircleGraphData = {
  links: [
    { source: "London", target: "South East", value: 243 },
    { source: "East", target: "London", value: 155 },
    { source: "South East", target: "South West", value: 108 },
    { source: "East", target: "South East", value: 78 },
    { source: "London", target: "South West", value: 66 },
    { source: "North West", target: "Yorkshire", value: 65 },
    { source: "East Midlands", target: "West Midlands", value: 59 },
    { source: "London", target: "West Midlands", value: 55 },
    { source: "East", target: "East Midlands", value: 53 },
    { source: "East Midlands", target: "Yorkshire", value: 53 },
    { source: "East Midlands", target: "London", value: 50 },
    { source: "East Midlands", target: "South East", value: 49 },
    { source: "London", target: "North West", value: 49 },
    { source: "North West", target: "West Midlands", value: 48 },
    { source: "South East", target: "West Midlands", value: 44 },
    { source: "South West", target: "West Midlands", value: 39 },
    { source: "London", target: "Yorkshire", value: 38 },
    { source: "North West", target: "South East", value: 35 },
    { source: "East Midlands", target: "North West", value: 34 },
    { source: "North East", target: "Yorkshire", value: 34 },
  ],
  nodes: [
    { id: "North East", value: 133 },
    { id: "North West", value: 342 },
    { id: "Yorkshire", value: 303 },
    { id: "East Midlands", value: 344 },
    { id: "West Midlands", value: 332 },
    { id: "East", value: 419 },
    { id: "London", value: 709 },
    { id: "South East", value: 636 },
    { id: "South West", value: 357 },
  ],
};
