// A consumer on NodeNext resolution: every public subpath, and a prop typed
// through it, so a declaration that fails to resolve shows as an error.
import { RungBars } from "@howells/hairline";
import type { RungBarsProps } from "@howells/hairline";
import { DumbbellQueue } from "@howells/hairline/dumbbell-queue";
import { HairlineArea } from "@howells/hairline/hairline-area";
import { HairlineLine } from "@howells/hairline/hairline-line";
import { Chart } from "@howells/hairline/kit";
import { USChoropleth } from "@howells/hairline/maps";
import { PlumbScatter } from "@howells/hairline/plumb-scatter";
import { registry } from "@howells/hairline/schema";
import { Slope } from "@howells/hairline/slope";
import type { SlopeProps } from "@howells/hairline/slope";
import { deriveTheme } from "@howells/hairline/theme";

export const parts = [
  RungBars,
  DumbbellQueue,
  HairlineArea,
  HairlineLine,
  PlumbScatter,
  Slope,
  USChoropleth,
  Chart,
];
export const kinds = registry.map((chart) => chart.kind);
export const theme = deriveTheme;
// Not `any`: a wrong key must be an error.
// @ts-expect-error -- unknown prop
export const bad: RungBarsProps = { nonsense: 1 };
export type Slopes = SlopeProps;
