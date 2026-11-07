import type { PlumbDatum, PlumbScatterProps } from "../../schema/plumb-scatter";
import { avoidBoxes } from "../pointer-model";
import { sansWidth } from "../util";

/*
 * Where PlumbScatter prints its points' names: beside or above each dot,
 * clear of the other stems, and the boxes the tip keeps off.
 */

/** Where a point's name sits: centred above the dot, or beside it. */
export interface Placement {
  anchor: "end" | "middle" | "start";
  dx: number;
  dy: number;
}

/** Margin kept between a name and the svg edge. */
export const EDGE = 2;

/** A name's reach above and below its baseline, halo included, px. */
const NAME_RISE = 12;
const NAME_DROP = 4;

const ABOVE: Placement = { anchor: "middle", dx: 0, dy: -12 };

const PLACEMENTS: Placement[] = [
  ABOVE,
  { anchor: "start", dx: 10, dy: 4 },
  { anchor: "end", dx: -10, dy: 4 },
];

/** Horizontal extent of a name set with `place` at `px`. */
const extent = (place: Placement, px: number, w: number) => {
  if (place.anchor === "middle") {
    return [px - w / 2, px + w / 2];
  }

  return place.anchor === "start"
    ? [px + place.dx, px + place.dx + w]
    : [px + place.dx - w, px + place.dx];
};

/**
 * The first placement whose name stays inside the svg and crosses no other
 * point's stem: a stem runs from its dot down to the floor, so a name set low
 * beside a tall stem would cut it. Failing that, the hero's name takes the
 * first that stays inside, or sits above slid in from the edge; any other
 * name is left to the tooltip.
 */
const placeName = (
  self: { px: number; py: number; w: number },
  stems: { px: number; py: number }[],
  width: number,
  hero: boolean
): Placement | undefined => {
  const inside = (place: Placement) => {
    const [l, r] = extent(place, self.px, self.w);

    return l >= EDGE && r <= width - EDGE && self.py + place.dy - 10 > 0;
  };

  const clear = (place: Placement) => {
    const [l, r] = extent(place, self.px, self.w);

    return stems.every(
      (st) =>
        st.px === self.px ||
        st.px < l - 4 ||
        st.px > r + 4 ||
        st.py > self.py + place.dy + 2
    );
  };

  const clean = PLACEMENTS.find((place) => inside(place) && clear(place));

  if (clean !== undefined || !hero) {
    return clean;
  }

  const half = self.w / 2;

  return (
    PLACEMENTS.find(inside) ?? {
      ...ABOVE,
      dx: Math.max(
        EDGE + half - self.px,
        Math.min(0, width - EDGE - half - self.px)
      ),
    }
  );
};

/** Spots along a point's printed name, for reference labels to keep clear of. */
const nameSpots = (
  place: Placement | undefined,
  self: { px: number; py: number; w: number }
) => {
  if (place === undefined) {
    return [];
  }

  const [l, r] = extent(place, self.px, self.w);
  const y = self.py + place.dy;

  return Array.from({ length: Math.ceil((r - l) / 24) + 1 }, (_, k) => ({
    x: Math.min(r, l + k * 24),
    y,
  }));
};

interface NamesArgs {
  format: (v: number) => string;
  heroes: ReadonlySet<number>;
  labelled: Set<number>;
  metrics: PlumbScatterProps["metrics"];
  width: number;
  x: (v: number) => number;
  y: (v: number) => number;
}

/** Where each labelled point prints its name, and the spots that keeps reference labels off. */
export const namesOf = (data: PlumbDatum[], a: NamesArgs) => {
  const { format, heroes, labelled, metrics, width, x, y } = a;

  const selves = data.map((d, i) => ({
    px: x(d.x),
    py: y(d.y),
    w: sansWidth(
      `${d.label} · ${format(d.y)}`,
      heroes.has(i) ? 12 : 11,
      metrics
    ),
  }));

  const places = selves.map((self, i) =>
    labelled.has(i)
      ? placeName(
          self,
          selves.map((o) => ({ px: o.px, py: o.py })),
          width,
          heroes.has(i)
        )
      : undefined
  );

  const avoid = [
    ...data.map((d) => ({ x: x(d.x), y: y(d.y) })),
    ...selves.flatMap((self, i) => nameSpots(places[i], self)),
  ];

  // Each printed name's box, so the tip stands off the plates it would hide.
  const names = avoidBoxes(
    selves.flatMap((self, i) => {
      const place = places[i];

      if (place === undefined) {
        return [];
      }

      const [l, r] = extent(place, self.px, self.w);
      const baseline = self.py + place.dy;

      return [
        {
          bottom: baseline + NAME_DROP,
          left: l,
          right: r,
          top: baseline - NAME_RISE,
        },
      ];
    })
  );

  return { avoid, names, places };
};
