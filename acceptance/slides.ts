// What the acceptance deck must contain: one slide per chart and theme, named
// the way the fixture names them. Written out here, not read from the fixture.
export const KINDS = [
  "rung-bars",
  "hairline-line",
  "hairline-area",
  "plumb-scatter",
  "slope",
  "dumbbell-queue",
] as const;
export const THEMES = ["dark", "light"] as const;
export const SLIDE_IDS = KINDS.flatMap((kind) =>
  THEMES.map((theme) => `${kind}-${theme}`)
);
export const SLIDE_COUNT = 12;
