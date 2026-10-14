import { normals } from "../util";

/** One distribution: its name and the raw samples. */
export interface RidgeSeries {
  label: string;
  values: number[];
}

/**
 * Hours to resolve a Fieldnote support ticket in 2026, by plan: a main crest
 * plus the tail of tickets that wait for an engineer.
 */
export const ridgelineDemo: RidgeSeries[] = [
  {
    label: "Enterprise",
    values: [...normals(61, 380, 5.6, 1.7), ...normals(62, 70, 13, 2.6)],
  },
  {
    label: "Business",
    values: [...normals(71, 320, 8.6, 2.3), ...normals(72, 110, 19, 3.4)],
  },
  {
    label: "Pro",
    values: [...normals(81, 280, 12.6, 2.9), ...normals(82, 140, 25, 3.6)],
  },
  {
    label: "Plus",
    values: [...normals(91, 260, 17.4, 3.4), ...normals(92, 140, 30, 3.4)],
  },
  { label: "Free", values: normals(103, 360, 24.5, 4.2) },
];
