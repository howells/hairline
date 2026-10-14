import { useState } from "react";

import { Plot, Tooltip } from "../core";
import {
  CrossHatch,
  DotScreen,
  EngravedRect,
  KeySwatch,
  Rules,
} from "../texture";
import {
  HALFTONE_R,
  TEXTURE_PITCH,
  paint,
  useTextureIds,
} from "../texture-ids";
import { dimClass, sansWidth, stagger, sum } from "../util";
import { timeSharesDemo } from "./hatched-stack.data";
import type { ShareTable, WorkKind, WorkTexture } from "./hatched-stack.data";

/**
 * Bar height: 53px inside the outline (4k + 1 for the dot screen, 3k + 2 for
 * the level rules), so both sit an equal distance from the top and bottom
 * rules (see LEAD).
 */
const BAR_H = 55;
const ROW = 88;
const KEY_LINE = 20;
/** Room between the key and the first bar. */
const KEY_GAP = 12;
/** KeySwatch's size, and the gap after it. */
const SWATCH = 12;
const SWATCH_GAP = 6;

interface Hover {
  kind: number;
  row: number | null;
  x: number;
  y: number;
}

/** Where the hero sits: the single largest share in the table. */
interface Cell {
  kind: number;
  row: number;
}

const heroOf = (data: ShareTable): Cell => {
  let best = { kind: 0, row: 0 };
  for (const [row, team] of data.rows.entries()) {
    for (const [kind, v] of team.shares.entries()) {
      if (v > data.rows[best.row].shares[best.kind]) {
        best = { kind, row };
      }
    }
  }
  return best;
};

/** Every texture a kind of work can carry, and its resting tone. */
const TONES: Record<WorkTexture, string> = {
  cross: "fill-l4",
  dots: "fill-l3",
  level: "fill-l5",
  upright: "fill-l2",
};
const TEXTURES: WorkTexture[] = ["cross", "dots", "level", "upright"];

/**
 * Where each texture's tile meets a segment's inside edge. Every segment
 * pins its texture to its own outline, so the screen starts the same way
 * in every segment wherever it begins: dots 1.2px in, the first rule two
 * clear pixels in, never drawn against the outline.
 */
const LEAD: Record<WorkTexture, { x: number; y: number }> = {
  cross: { x: 0, y: 0 },
  dots: { x: 0, y: 0 },
  level: { x: 0, y: 1 },
  upright: { x: 1, y: 0 },
};

/**
 * Dots and upright rules stop on a whole tile before the right outline, so
 * no dot is cut and no rule doubles the outline, whatever a share's width.
 */
const WHOLE: Record<WorkTexture, { clear: number; pitch: number } | undefined> =
  {
    cross: undefined,
    dots: { clear: 1, pitch: TEXTURE_PITCH.screen },
    level: undefined,
    upright: { clear: 0, pitch: TEXTURE_PITCH.dense },
  };

/**
 * The pattern for one texture family, on paper, in one ramp tone: dense
 * upright rules, a halftone screen, crosshatch, or level rules.
 */
const engrave = (texture: WorkTexture, id: string, tone: string) => {
  if (texture === "cross") {
    return <CrossHatch ground="fill-paper" id={id} key={id} tone={tone} />;
  }
  if (texture === "dots") {
    return (
      // The halftone ladder's middle step: clearly visible at pitch 4.
      <DotScreen
        ground="fill-paper"
        id={id}
        key={id}
        r={HALFTONE_R[2]}
        tone={tone}
      />
    );
  }
  if (texture === "level") {
    return <Rules ground="fill-paper" id={id} key={id} tone={tone} />;
  }
  return (
    <Rules angle="upright" ground="fill-paper" id={id} key={id} tone={tone} />
  );
};

/** One pattern per texture, each at its own grey on paper, plus the hero's in ink. */
const Textures = (props: {
  heroTexture: WorkTexture;
  tex: (name: string) => string;
}) => (
  <defs>
    {TEXTURES.map((t) => engrave(t, props.tex(t), TONES[t]))}
    {engrave(props.heroTexture, props.tex("hero"), "fill-hero")}
  </defs>
);

interface Seg {
  k: number;
  w: number;
  x: number;
}

/** Whole-pixel segments with a 1px paper gap between neighbours. */
const segments = (shares: number[], x0: number, x1: number): Seg[] => {
  const total = sum(shares);
  let acc = 0;
  return shares.map((v, k) => {
    const a = Math.round(x0 + ((x1 - x0) * acc) / total);
    acc += v;
    const b = Math.round(x0 + ((x1 - x0) * acc) / total);
    return { k, w: b - a - (k === shares.length - 1 ? 0 : 1), x: a };
  });
};

interface KeyItem {
  k: number;
  kind: WorkKind;
  w: number;
  x: number;
  y: number;
}

/** Swatches in reading order, wrapping onto a new line when the room runs out. */
const keyLayout = (kinds: WorkKind[], x0: number, width: number) => {
  let x = x0;
  let y = 0;
  const items: KeyItem[] = [];
  for (const [k, kind] of kinds.entries()) {
    const w = SWATCH + SWATCH_GAP + sansWidth(kind.name, 11) + 16;
    if (x + w - 16 > width && x > x0) {
      x = x0;
      y += KEY_LINE;
    }
    items.push({ k, kind, w, x, y });
    x += w;
  }
  return { height: y + KEY_LINE + 8, items };
};

interface KeyProps {
  hover: number | null;
  items: KeyItem[];
  onHover: (k: number | null) => void;
  tex: (name: string) => string;
}

/** Engraved swatches with their names, above the bars. */
const Key = (props: KeyProps) => (
  <g>
    {props.items.map(({ k, kind, w, x, y }) => (
      <g
        className={dimClass(props.hover !== null && props.hover !== k)}
        key={kind.name}
        onPointerEnter={() => {
          props.onHover(k);
        }}
      >
        <rect
          className="fill-transparent"
          height={KEY_LINE}
          width={w}
          x={x}
          y={y}
        />
        <KeySwatch
          fill={paint(props.tex(kind.texture))}
          x={x}
          y={y + KEY_LINE / 2 - SWATCH / 2}
        />
        <text
          className="t-note"
          dy="0.34em"
          x={x + SWATCH + SWATCH_GAP}
          y={y + KEY_LINE / 2}
        >
          {kind.name}
        </text>
      </g>
    ))}
  </g>
);

interface RowsProps {
  data: ShareTable;
  hero: Cell;
  hover: Hover | null;
  labelW: number;
  setHover: (h: Hover | null) => void;
  tex: (name: string) => string;
  top: number;
  width: number;
}

/**
 * One engraved bar per team: name on the left, its first share on the
 * right. Each segment is its texture on paper inside a 1px rule; the hero
 * segment is engraved and ruled in ink.
 */
const Rows = (props: RowsProps) => {
  const x0 = props.labelW;
  const x1 = props.width - 40;
  return (
    <g>
      {props.data.rows.map((row, r) => {
        const y = props.top + r * ROW;
        const heroRow = r === props.hero.row;
        return (
          <g key={row.team}>
            <text
              className={`t-label ${heroRow ? "" : "fill-muted"}`}
              dy="0.34em"
              x={0}
              y={y + BAR_H / 2}
            >
              {row.team}
            </text>
            {segments(row.shares, x0, x1).map((s) => {
              const hero = heroRow && s.k === props.hero.kind;
              const { texture } = props.data.kinds[s.k];
              return (
                <EngravedRect
                  className={`grow-x ${hero ? "stroke-ink" : "stroke-l5"} ${dimClass(props.hover !== null && props.hover.kind !== s.k)}`}
                  fill={paint(props.tex(hero ? "hero" : texture))}
                  height={BAR_H}
                  key={props.data.kinds[s.k].name}
                  lead={LEAD[texture]}
                  onPointerEnter={() => {
                    props.setHover({
                      kind: s.k,
                      row: r,
                      x: s.x + s.w / 2,
                      y: y - 4,
                    });
                  }}
                  style={stagger(r * 2 + s.k, "mark")}
                  whole={WHOLE[texture]}
                  width={s.w}
                  x={s.x}
                  y={y}
                />
              );
            })}
            <text
              className={`fade t-value ${heroRow ? "" : "fill-muted"}`}
              dy="0.34em"
              textAnchor="end"
              x={props.width}
              y={y + BAR_H / 2}
            >
              {`${row.shares[props.hero.kind]}%`}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/**
 * O10 Hatched shares. Part-to-whole bars told apart by four engraving
 * families at four greys, not by colour: dense upright rules, a halftone
 * screen, crosshatch and sparse level rules. The largest share, Product's
 * new work, is the one segment in ink.
 */
export const HatchedStack = (props: { data?: ShareTable }) => {
  const data = props.data ?? timeSharesDemo;
  const tex = useTextureIds("shares");
  const [hover, setHover] = useState<Hover | null>(null);
  const hero = heroOf(data);
  const labelW = Math.max(...data.rows.map((r) => sansWidth(r.team, 12))) + 16;
  const row = hover?.row ?? null;
  const kindName = data.kinds[hero.kind].name.toLowerCase();
  return (
    <Plot
      overlay={
        hover === null || row === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{data.rows[row].team}</b> ·{" "}
            {data.kinds[hover.kind].name.toLowerCase()}{" "}
            {data.rows[row].shares[hover.kind]}%
          </Tooltip>
        )
      }
    >
      {(width) => {
        const key = keyLayout(data.kinds, width < 480 ? 0 : labelW, width);
        const top = key.height + KEY_GAP;
        const height = top + data.rows.length * ROW - (ROW - BAR_H);
        const label = `Share of engineering time by team, 2026: ${data.rows.map((r) => `${r.team} ${r.shares[hero.kind]}% ${kindName}`).join(", ")}`;
        return (
          <svg
            aria-label={label}
            height={height}
            onPointerLeave={() => {
              setHover(null);
            }}
            width={width}
          >
            <title>{label}</title>
            <Textures heroTexture={data.kinds[hero.kind].texture} tex={tex} />
            <Key
              hover={hover?.kind ?? null}
              items={key.items}
              onHover={(k) => {
                setHover(
                  k === null ? null : { kind: k, row: null, x: 0, y: 0 }
                );
              }}
              tex={tex}
            />
            <Rows
              data={data}
              hero={hero}
              hover={hover}
              labelW={labelW}
              setHover={setHover}
              tex={tex}
              top={top}
              width={width}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
