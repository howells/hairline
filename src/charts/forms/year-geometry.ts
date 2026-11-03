import { fmtDegC } from "../../lib/format";

/** Month i's angle, clockwise from twelve o'clock. */
export const angleOf = (i: number, n: number) => (i / n) * Math.PI * 2;

/** A point at `angle` (clockwise from twelve) and distance `r` from the centre. */
export const polar = (angle: number, r: number) => ({
  x: Math.sin(angle) * r,
  y: -Math.cos(angle) * r,
});

/** Ring values are whole degrees ("20 °C"). */
export const fmtRing = (v: number) => fmtDegC(v).replace(".0 °C", " °C");
