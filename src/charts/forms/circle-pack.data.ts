/**
 * O9 Towers by county: church towers with a ring of bells hung for full-circle
 * ringing, by country and county.
 * Source: Dove's Guide for Church Bell Ringers (Central Council of Church Bell
 * Ringers), https://dove.cccbr.org.uk/downloads (CC BY-SA 4.0; changes made:
 * counted and trimmed, below).
 * Fetched 2026-10-15.
 * File: dove.csv (one row per full-circle or lightweight ring). Transform:
 * rows with RingType "Full-circle ring" only; the distinct TowerID values
 * counted for each Country and County. Three countries are shown: England
 * (the six counties with most towers, of 49 with any; 6,656 towers in all),
 * Wales (the four with most, of 22; 228 in all) and Australia (the four with
 * most, of 8; 70 in all). Each cut falls where the next county has fewer
 * towers than the last one kept.
 */

/** A node in the hierarchy: a country with counties, or a county with its tower count. */
export interface OrgNode {
  children?: OrgNode[];
  name: string;
  value?: number;
}

/** Towers with a full-circle ring in the largest counties of England, Wales and Australia. */
export const orgDemo: OrgNode = {
  children: [
    {
      children: [
        { name: "Devon", value: 415 },
        { name: "Somerset", value: 384 },
        { name: "Lincolnshire", value: 347 },
        { name: "Suffolk", value: 279 },
        { name: "Norfolk", value: 251 },
        { name: "Kent", value: 238 },
      ],
      name: "England",
    },
    {
      children: [
        { name: "Powys", value: 54 },
        { name: "Monmouthshire", value: 30 },
        { name: "The Vale of Glamorgan", value: 21 },
        { name: "Carmarthenshire", value: 13 },
      ],
      name: "Wales",
    },
    {
      children: [
        { name: "New South Wales", value: 36 },
        { name: "Victoria", value: 12 },
        { name: "Western Australia", value: 8 },
        { name: "South Australia", value: 5 },
      ],
      name: "Australia",
    },
  ],
  name: "Dove",
};
