/*
 * Engraved textures, shared by every chart. Every mark sits on the svg's own
 * pixel grid: diagonals are clean 1px pixel staircases, dots sit on an even
 * lattice, and colours come from ramp classes so textures follow the palette.
 * Textures go on paper (pass `ground="fill-paper"`), outlined with a 1px rule.
 *
 * Pitches are named in TEXTURE_PITCH (texture-ids.ts): hatch 4, crosshatch 6,
 * dot screen 4, dense screen 3. Density and angle may encode a value; the
 * hero is crosshatched or solid ink.
 */
import type { CSSProperties } from "react";

import { TEXTURE_PITCH } from "./texture-ids";
import { sansWidth } from "./util";

interface PatternProps {
  /** Fill class for the ground under the marks, e.g. "fill-paper". */
  ground?: string;
  id: string;
  /** Grid pitch in whole px. */
  pitch?: number;
  /** Ramp fill class for the engraved marks, e.g. "fill-l3". */
  tone: string;
}

const Ground = (props: { className?: string; h: number; w: number }) =>
  props.className === undefined ? null : (
    <rect className={props.className} height={props.h} width={props.w} />
  );

/** The pixels of one diagonal across a `pitch` tile, shifted down by `offset`. */
const diagonal = (pitch: number, falling: boolean, offset: number) =>
  Array.from({ length: pitch }, (_, k) => ({
    x: k,
    y: ((falling ? k : pitch - 1 - k) + offset) % pitch,
  }));

const Pixels = (props: {
  cells: { x: number; y: number }[];
  name: string;
  tone: string;
}) => (
  <g className={props.tone}>
    {props.cells.map((c) => (
      <rect
        height={1}
        key={`${props.name}-${c.x}-${c.y}`}
        width={1}
        x={c.x}
        y={c.y}
      />
    ))}
  </g>
);

interface HatchProps extends PatternProps {
  /** Rising (/) by default, or falling (\). */
  angle?: "falling" | "rising";
}

/** Diagonal hatch: one 1px line per tile, as a pixel staircase. */
export const Hatch = ({
  angle = "rising",
  ground,
  id,
  pitch = TEXTURE_PITCH.hatch,
  tone,
}: HatchProps) => (
  <pattern height={pitch} id={id} patternUnits="userSpaceOnUse" width={pitch}>
    <Ground className={ground} h={pitch} w={pitch} />
    <Pixels
      cells={diagonal(pitch, angle === "falling", 0)}
      name={id}
      tone={tone}
    />
  </pattern>
);

/**
 * Crosshatch: both diagonals, the falling one offset by half a pitch so the
 * crossings spread evenly instead of stacking into a chequerboard.
 */
export const CrossHatch = ({
  ground,
  id,
  pitch = TEXTURE_PITCH.cross,
  tone,
}: PatternProps) => {
  const rising = diagonal(pitch, false, 0);
  const falling = diagonal(pitch, true, Math.floor(pitch / 2)).filter(
    (f) => !rising.some((r) => r.x === f.x && r.y === f.y)
  );
  return (
    <pattern height={pitch} id={id} patternUnits="userSpaceOnUse" width={pitch}>
      <Ground className={ground} h={pitch} w={pitch} />
      <Pixels cells={[...rising, ...falling]} name={id} tone={tone} />
    </pattern>
  );
};

interface RulesProps extends PatternProps {
  /** Level (horizontal) by default, or upright (vertical). */
  angle?: "level" | "upright";
}

/** Fine rules: one 1px line every `pitch` px. */
export const Rules = ({
  angle = "level",
  ground,
  id,
  pitch = TEXTURE_PITCH.dense,
  tone,
}: RulesProps) => (
  <pattern height={pitch} id={id} patternUnits="userSpaceOnUse" width={pitch}>
    <Ground className={ground} h={pitch} w={pitch} />
    <rect
      className={tone}
      height={angle === "level" ? 1 : pitch}
      width={angle === "level" ? pitch : 1}
    />
  </pattern>
);

/** Stipple: one 1px dot per cell, alternate rows offset by half a pitch. */
export const Stipple = ({
  ground,
  id,
  pitch = TEXTURE_PITCH.screen,
  tone,
}: PatternProps) => (
  <pattern
    height={pitch * 2}
    id={id}
    patternUnits="userSpaceOnUse"
    width={pitch}
  >
    <Ground className={ground} h={pitch * 2} w={pitch} />
    <rect className={tone} height={1} width={1} x={0} y={0} />
    <rect
      className={tone}
      height={1}
      width={1}
      x={Math.floor(pitch / 2)}
      y={pitch}
    />
  </pattern>
);

interface DotScreenProps extends PatternProps {
  /** Dot radius; one radius per screen. Larger dots read as a darker step. */
  r: number;
}

/** The eight neighbouring tiles' offsets, plus the tile itself. */
const NEIGHBOURS = [-1, 0, 1].flatMap((dx) =>
  [-1, 0, 1].map((dy) => ({ dx, dy, key: `${dx}${dy}` }))
);

/**
 * A halftone screen: one dot of fixed radius at the centre of every tile.
 * A dot too big for its tile is drawn with the parts its neighbours spill
 * in, so the darkest screens stay round instead of clipping square.
 */
export const DotScreen = ({
  ground,
  id,
  pitch = TEXTURE_PITCH.screen,
  r,
  tone,
}: DotScreenProps) => {
  // The middle pixel's centre, so a small dot never touches the tile's edge.
  const c = Math.floor(pitch / 2) + 0.5;
  const spills = r > Math.min(c, pitch - c);
  const copies = spills ? NEIGHBOURS : [{ dx: 0, dy: 0, key: "00" }];
  return (
    <pattern height={pitch} id={id} patternUnits="userSpaceOnUse" width={pitch}>
      <Ground className={ground} h={pitch} w={pitch} />
      <g className={tone}>
        {copies.map((n) => (
          <circle
            cx={c + n.dx * pitch}
            cy={c + n.dy * pitch}
            key={n.key}
            r={r}
          />
        ))}
      </g>
    </pattern>
  );
};

/**
 * Beads: 1px columns every `pitch` px. Inside a 2px rung this reads as a row
 * of evenly spaced dots: a broken rung.
 */
export const Beads = ({
  ground,
  id,
  pitch = TEXTURE_PITCH.dense,
  tone,
}: PatternProps) => (
  <pattern height={1} id={id} patternUnits="userSpaceOnUse" width={pitch}>
    <Ground className={ground} h={1} w={pitch} />
    <rect className={tone} height={1} width={1} />
  </pattern>
);

interface DottedLineProps {
  /** Extra classes, e.g. motion. */
  className?: string;
  /** Pixel step between dots; 3 is the "provisional" and guide pitch. */
  pitch?: number;
  /** Ramp fill class for the dots, e.g. "fill-l4". */
  tone: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * An evenly dotted straight guide, horizontal or vertical: 1px dots on whole
 * pixels. Pass equal x0/x1 for a vertical line, equal y0/y1 for a horizontal.
 */
export const DottedLine = ({
  className,
  pitch = TEXTURE_PITCH.dense,
  tone,
  x0,
  x1,
  y0,
  y1,
}: DottedLineProps) => {
  const vertical = Math.round(x0) === Math.round(x1);
  const a = Math.round(vertical ? Math.min(y0, y1) : Math.min(x0, x1));
  const b = Math.round(vertical ? Math.max(y0, y1) : Math.max(x0, x1));
  const fixed = Math.round(vertical ? x0 : y0);
  const n = Math.max(0, Math.floor((b - a) / pitch));
  return (
    <g className={`${className ?? ""} ${tone}`}>
      {Array.from({ length: n + 1 }, (_, k) => {
        const run = a + k * pitch;
        return (
          <rect
            height={1}
            key={`dot-${fixed}-${run}`}
            width={1}
            x={vertical ? fixed : run}
            y={vertical ? run : fixed}
          />
        );
      })}
    </g>
  );
};

/** One full turn, in radians. */
const TURN = 2 * Math.PI;

interface DotRingProps {
  /** Extra classes, e.g. motion. */
  className?: string;
  cx: number;
  cy: number;
  /** Angles in radians, clockwise from noon; a full ring when omitted. */
  from?: number;
  r: number;
  /** Arc-length step between dots in px. */
  step?: number;
  to?: number;
  /** Ramp fill class for the dots, e.g. "fill-l4". */
  tone: string;
}

/** An evenly dotted ring or arc: dots of one fixed radius at one fixed step. */
export const DotRing = ({
  className,
  cx,
  cy,
  from = 0,
  r,
  step = TEXTURE_PITCH.screen,
  to,
  tone,
}: DotRingProps) => {
  const full = to === undefined;
  const end = to ?? from + TURN;
  const n = Math.max(1, Math.round(((end - from) * r) / step));
  const count = full ? n : n + 1;
  return (
    <g className={`${className ?? ""} ${tone}`}>
      {Array.from({ length: count }, (_, k) => {
        const a = from + ((end - from) * k) / n;
        return (
          <circle
            cx={cx + r * Math.sin(a)}
            cy={cy - r * Math.cos(a)}
            key={`ring-${r}-${k}`}
            r={0.75}
          />
        );
      })}
    </g>
  );
};

interface Vertex {
  x: number;
  y: number;
}

/** Points every `step` px of arc length along a polyline, from its start. */
const alongPolyline = (points: Vertex[], step: number) => {
  const dots: Vertex[] = [];
  // Distance from the current segment's start to the next dot.
  let next = 0;
  for (const [k, b] of points.entries()) {
    const a = points[k - 1];
    const length = a === undefined ? 0 : Math.hypot(b.x - a.x, b.y - a.y);
    if (a !== undefined && length > 0) {
      while (next <= length) {
        const t = next / length;
        dots.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        next += step;
      }
      next -= length;
    }
  }
  return dots;
};

interface DottedPathProps {
  /** Extra classes, e.g. motion. */
  className?: string;
  /** Arc-length step between dots in px; 3 is the "provisional" pitch. */
  pitch?: number;
  /** The line's vertices, in order. */
  points: Vertex[];
  /** Ramp fill class for the dots, e.g. "fill-l4". */
  tone: string;
}

/**
 * An evenly dotted data line: DotRing's dots at one fixed arc-length step
 * along any polyline. The provisional (future) stretch of a series.
 */
export const DottedPath = ({
  className,
  pitch = TEXTURE_PITCH.dense,
  points,
  tone,
}: DottedPathProps) => (
  <g className={`${className ?? ""} ${tone}`}>
    {alongPolyline(points, pitch).map((d) => (
      <circle
        cx={d.x}
        cy={d.y}
        key={`path-${d.x.toFixed(2)}-${d.y.toFixed(2)}`}
        r={0.75}
      />
    ))}
  </g>
);

/**
 * The whole pixels a straight 1px line covers between two points: one pixel
 * per step along its longer axis, so any angle reads as a clean staircase.
 */
const pixelSteps = (x0: number, y0: number, x1: number, y1: number) => {
  const n = Math.max(
    1,
    Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))
  );
  const seen = new Set<string>();
  const cells: { x: number; y: number }[] = [];
  for (let k = 0; k <= n; k += 1) {
    const x = Math.floor(x0 + ((x1 - x0) * k) / n);
    const y = Math.floor(y0 + ((y1 - y0) * k) / n);
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      cells.push({ x, y });
    }
  }
  return cells;
};

interface PixelLineProps {
  /** Extra classes on the group, e.g. motion. */
  className?: string;
  /** Ramp fill class for the pixels, e.g. "fill-l4". */
  tone: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * A 1px line at any angle drawn on whole pixels, the way the shared hatches
 * are: crisp where an antialiased short line would smudge.
 */
export const PixelLine = (props: PixelLineProps) => (
  <g className={`${props.className ?? ""} ${props.tone}`}>
    {pixelSteps(props.x0, props.y0, props.x1, props.y1).map((c) => (
      <rect height={1} key={`px-${c.x}-${c.y}`} width={1} x={c.x} y={c.y} />
    ))}
  </g>
);

interface KeySwatchProps {
  /** A pattern fill (`paint(id)`) or omit and pass a fill class in `tone`. */
  fill?: string;
  /** Fill class when the swatch is solid, e.g. "fill-hero". */
  tone?: string;
  x: number;
  y: number;
}

/**
 * The one key swatch: a 12 × 12 square, 2px corners, the series' texture on
 * paper inside a 1px rule; big enough that a texture reads as itself. Every
 * legend and key uses it. The swatch is translated to its own whole-pixel
 * corner, so its texture starts the same way inside every key.
 */
export const KeySwatch = (props: KeySwatchProps) => (
  <g transform={`translate(${Math.round(props.x)} ${Math.round(props.y)})`}>
    <rect
      className={`${props.tone ?? ""} stroke-l5 shape-crisp`}
      fill={props.fill}
      height={11}
      rx={2}
      strokeWidth={1}
      width={11}
      x={0.5}
      y={0.5}
    />
  </g>
);

interface EngravedRectProps {
  /** Outline tone, motion and hover classes, e.g. "stroke-l5 grow-x". */
  className?: string;
  /** The texture fill, `paint(id)`. */
  fill: string;
  /** Outer box in whole px: the 1px outline is its outermost pixels. */
  height: number;
  /**
   * Where the inside of the box falls on the pattern's tile, in px (default
   * 0, 0: the inside starts on a tile's first pixel). A rule pattern wants 1
   * so its first line is not drawn against the outline.
   */
  lead?: { x: number; y: number };
  onPointerEnter?: () => void;
  style?: CSSProperties;
  /**
   * For dot screens and upright rules: engrave whole tiles only, stopping on
   * a tile edge at least `clear` px before the right outline, so no mark is
   * cut by it or drawn against it. The rest of the inside is paper.
   */
  whole?: { clear: number; pitch: number };
  width: number;
  x: number;
  y: number;
}

/**
 * A textured box: the pattern on paper inside a crisp 1px outline, with the
 * pattern's tile pinned to the box rather than to the svg, so the texture
 * starts the same way against the outline wherever the box sits.
 */
export const EngravedRect = (props: EngravedRectProps) => {
  const lx = props.lead?.x ?? 0;
  const ly = props.lead?.y ?? 0;
  const w = Math.max(0, Math.round(props.width) - 1);
  const h = Math.max(0, Math.round(props.height) - 1);
  const outline = {
    height: h,
    strokeWidth: 1,
    width: w,
    x: lx - 0.5,
    y: ly - 0.5,
  };
  const translate = `translate(${Math.round(props.x) + 1 - lx} ${Math.round(props.y) + 1 - ly})`;
  if (props.whole === undefined) {
    return (
      <g transform={translate}>
        <rect
          {...outline}
          className={`shape-crisp ${props.className ?? "stroke-l5"}`}
          fill={props.fill}
          onPointerEnter={props.onPointerEnter}
          style={props.style}
        />
      </g>
    );
  }
  const { clear, pitch } = props.whole;
  // The inside's far edge on the pattern, pulled back to a whole tile.
  const end = Math.floor((lx + w - 1 - clear) / pitch) * pitch;
  return (
    <g transform={translate}>
      <g
        className={props.className ?? "stroke-l5"}
        onPointerEnter={props.onPointerEnter}
        style={props.style}
      >
        <rect {...outline} className="fill-paper shape-crisp" />
        <rect
          fill={props.fill}
          height={Math.max(0, h - 1)}
          stroke="none"
          width={Math.max(0, end - lx)}
          x={lx}
          y={ly}
        />
      </g>
    </g>
  );
};

/** Space around the text inside a plate, and the plate's height. */
const PLATE_PAD = 4;
const PLATE_H = 15;

interface PlateLabelProps {
  /** Where `x` sits on the text. */
  anchor?: "end" | "middle" | "start";
  /** The text role, e.g. `t-value` (default) or `t-label`. */
  className?: string;
  /** On the ink hero: an ink plate with paper text. */
  hero?: boolean;
  /** A quieter lead-in before the text, in the axis voice: a series name before its value. */
  lead?: string;
  text: string;
  x: number;
  /** The text's vertical centre. */
  y: number;
}

/**
 * The one way to set text on a texture: a small paper plate cut out of the
 * engraving, the text in ink on it (or an ink plate with paper text on the
 * hero). Text over lines and marks, not a texture, keeps the `t-halo`.
 */
export const PlateLabel = ({
  anchor = "middle",
  className = "t-value",
  hero = false,
  lead,
  text,
  x,
  y,
}: PlateLabelProps) => {
  const full = lead === undefined ? text : `${lead} ${text}`;
  const w = Math.ceil(sansWidth(full, 11)) + PLATE_PAD * 2;
  const offset = { end: w, middle: w / 2, start: 0 }[anchor];
  const left = Math.round(x - offset);
  const top = Math.round(y - PLATE_H / 2);
  return (
    <g>
      <rect
        className={hero ? "fill-hero" : "fill-paper"}
        height={PLATE_H}
        rx={2}
        width={w}
        x={left}
        y={top}
      />
      <text
        className={`${className} ${hero ? "fill-paper" : ""}`}
        dy="0.35em"
        textAnchor="middle"
        x={left + w / 2}
        y={top + PLATE_H / 2}
      >
        {lead === undefined ? null : (
          <tspan className={hero ? "" : "t-axis"}>{`${lead} `}</tspan>
        )}
        {text}
      </text>
    </g>
  );
};
