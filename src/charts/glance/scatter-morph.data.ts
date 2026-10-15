/**
 * G9 Largest asteroids: the twelve largest asteroids of the main belt. Size is
 * diameter in kilometres, x the tilt of the orbit (inclination, degrees), y how
 * stretched it is (eccentricity, 0 a circle).
 *
 * Source: NASA/JPL Small-Body Database (SBDB) Query API,
 * https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html , fetched 2026-10-15:
 * https://ssd-api.jpl.nasa.gov/sbdb_query.api?fields=full_name,name,diameter,a,i,e&sb-kind=a&sb-class=IMB,MBA,OMB&sort=-diameter&limit=12
 * The API pages state no licence; NASA/JPL products are US government works,
 * which is public domain in the US (an assumption, not a statement read there).
 *
 * Transform: sb-kind=a is asteroids; sb-class=IMB,MBA,OMB (inner, middle and
 * outer main belt) leaves out the trans-Neptunian bodies and centaurs that
 * the plain list puts among the largest, and the twelve largest by diameter
 * are kept in the order the API gives. Value is the diameter rounded to whole
 * kilometres; x is the inclination in degrees and y the eccentricity, as
 * given. Ceres, 939 km, is the largest and is also classed a dwarf planet;
 * Pallas, the third largest, has the most tilted orbit (34.93 degrees).
 */

export interface MorphDatum {
  label: string;
  /** Size: area in the scatter, height in the bars, angle in the ring. */
  value: number;
  /** Scatter x: orbital inclination, degrees. */
  x: number;
  /** Scatter y: orbital eccentricity. */
  y: number;
}

/** The twelve largest main-belt asteroids: diameter (km), inclination, eccentricity. */
export const scatterMorphDemo: MorphDatum[] = [
  { label: "Ceres", value: 939, x: 10.59, y: 0.0797 },
  { label: "Vesta", value: 523, x: 7.14, y: 0.0902 },
  { label: "Pallas", value: 513, x: 34.93, y: 0.2307 },
  { label: "Hygiea", value: 407, x: 3.83, y: 0.1067 },
  { label: "Interamnia", value: 306, x: 17.32, y: 0.1551 },
  { label: "Europa", value: 304, x: 7.48, y: 0.1125 },
  { label: "Davida", value: 270, x: 15.95, y: 0.1894 },
  { label: "Euphrosyne", value: 267, x: 26.31, y: 0.2158 },
  { label: "Patientia", value: 254, x: 15.21, y: 0.0695 },
  { label: "Sylvia", value: 253, x: 10.85, y: 0.0942 },
  { label: "Juno", value: 247, x: 12.99, y: 0.2557 },
  { label: "Cybele", value: 237, x: 3.57, y: 0.1279 },
];
