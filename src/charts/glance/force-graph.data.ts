/**
 * G11 Into the Thames: the Thames at Kingston as the hub, seven tributaries
 * round it, each sized by its mean flow.
 *
 * Source: Environment Agency Hydrology API, daily mean flow in m3/s,
 * Open Government Licence v3.0, https://environment.data.gov.uk/hydrology/ ,
 * fetched 2026-10-15. For each station the measure
 * <station guid>-flow-m-86400-m3s-qualified, read with
 * https://environment.data.gov.uk/hydrology/id/measures/<measure>/readings.json?mineq-date=1996-10-01&maxeq-date=2024-09-30&_limit=20000
 *   Thames: Kingston (3400TH, 8496ce69-482c-406a-a2f0-ac418ef8f099)
 *   Wey: Weybridge (3090TH, 2629abeb-e504-49f7-9996-080f37e15930)
 *   Cherwell: Oxford (1490TH, 839866a2-80ca-42a8-a695-8e6d6b165fa6)
 *   Mole: Esher (3290TH, 024f218d-9a70-43b7-8ea2-7d038eeb2cff)
 *   Colne: Denham Colne (2870TH, cb5596d4-deb7-4784-ad4e-5c21279082ab)
 *   Evenlode: Cassington (1290TH, 8afc6e20-b0bd-4b79-bf65-345dac8cafee_1290TH)
 *   Thame: Wheatley (1980TH, b86817d4-c71b-4bd4-ab64-4982bf812b12)
 *   Windrush: Newbridge (1090TH, 37f9d60e-0bdc-4578-b03b-77103b250a09)
 *
 * Transform: the mean of all daily readings that have a value between
 * 1996-10-01 and 2024-09-30 (28 water years), in m3/s. Stations differ in
 * how many of the 10,227 days they cover: Thames, Colne and Thame all 10,227;
 * Wey 10,221; Evenlode 10,103; Mole 10,077; Windrush 9,980 (its record stops
 * in February 2024); Cherwell 8,842 (86%). A hub link carries the tributary's
 * mean flow. The seven means add up to 36.5 m3/s against 65.4 m3/s at
 * Kingston; the rest is the main river above the confluences and the
 * tributaries not drawn. The Kennet, a larger tributary, reports level only
 * at Theale and Knighton on this API, so it is left out.
 */

export interface ForceNode {
  id: string;
  /** Mean flow, m3/s. */
  value: number;
}

export interface ForceLink {
  source: string;
  target: string;
  /** Mean flow of the tributary, m3/s. */
  value: number;
}

export interface ForceGraphData {
  nodes: ForceNode[];
  links: ForceLink[];
}

/** The Thames at Kingston and seven tributaries, mean daily flow in m3/s. */
export const forceGraphDemo: ForceGraphData = {
  links: [
    { source: "Thames", target: "Wey", value: 8.08 },
    { source: "Thames", target: "Cherwell", value: 6.71 },
    { source: "Thames", target: "Mole", value: 5.71 },
    { source: "Thames", target: "Colne", value: 4.43 },
    { source: "Thames", target: "Evenlode", value: 4.03 },
    { source: "Thames", target: "Thame", value: 3.81 },
    { source: "Thames", target: "Windrush", value: 3.7 },
  ],
  nodes: [
    { id: "Thames", value: 65.36 },
    { id: "Wey", value: 8.08 },
    { id: "Cherwell", value: 6.71 },
    { id: "Mole", value: 5.71 },
    { id: "Colne", value: 4.43 },
    { id: "Evenlode", value: 4.03 },
    { id: "Thame", value: 3.81 },
    { id: "Windrush", value: 3.7 },
  ],
};
