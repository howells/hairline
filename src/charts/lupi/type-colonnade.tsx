import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, sansWidth, stagger, wrapWords } from "../util";
import { typeColonnadeDemo } from "./type-colonnade.data";
import type { OwnershipDatum } from "./type-colonnade.data";

interface TypeColonnadeProps {
  data?: OwnershipDatum[];
  height?: number;
  /** How many of the largest owners to draw in the hero colour. Default 1. */
  strong?: number;
  /** Noun for the tooltip count, e.g. "repos". */
  unit?: string;
  note?: string;
  /** Owner to draw in the hero colour. */
  highlight?: string;
}

interface Focus {
  owner?: string;
  item?: number;
}

interface OwnerNode {
  owner: string;
  count: number;
  rank: number;
}

interface Layout {
  left: number;
  blockW: number;
  /** Left edge of the repo column, each repo's dot centre, and where its line starts. */
  xTick0: number;
  xDot: number;
  xTick1: number;
  xOwner: number;
  pitch: number;
  rMax: number;
  /** Each repo's row, grouped by owner (whole px). */
  yItem: (i: number) => number;
  yOwner: (o: string) => number;
  rOf: (c: number) => number;
  /** Height the stacks, fans and any footnote need. */
  height: number;
  /** Each owner's "Name · count" label, wrapped to the room beside its node. */
  ownerLines: Map<string, string[]>;
}

/** Leading of a wrapped owner label; node to label gap; margin at the edge. */
const OWNER_LINE = 12;
const OWNER_GAP = 10;
const OWNER_EDGE = 4;
/** Empty rows between two owners' stacks; radius of one repo's hollow dot. */
const GROUP_GAP = 2;
const DOT_R = 2;

/** Width of an owner label in `t-label`. */
const labelWidth = (s: string) => sansWidth(s, 12);

/** "Name · count", the count glued to the last word so it never wraps alone. */
const ownerText = (o: OwnerNode) => `${o.owner}\u00A0·\u00A0${o.count}`;

/**
 * Room right of the owner column: the default (150, or 108 narrow), grown to
 * fit the widest owner label up to ~42% of the block. Labels still too long
 * wrap at word breaks.
 */
const ownerReserve = (
  owners: OwnerNode[],
  rOf: (c: number) => number,
  base: number,
  blockW: number
) => {
  const need = Math.max(
    0,
    ...owners.map(
      (o) => rOf(o.count) + OWNER_GAP + labelWidth(ownerText(o)) + OWNER_EDGE
    )
  );
  return Math.max(base, Math.min(Math.ceil(need), blockW * 0.42));
};

const tally = (data: OwnershipDatum[]): OwnerNode[] => {
  const counts = new Map<string, number>();
  for (const d of data) {
    counts.set(d.owner, (counts.get(d.owner) ?? 0) + 1);
  }
  return [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .map(([owner, count], rank) => ({ count, owner, rank }));
};

/** Each repo's row slot: grouped by owner rank, a gap between groups. */
const slotsOf = (data: OwnershipDatum[], owners: OwnerNode[]) => {
  const rank = new Map(owners.map((o) => [o.owner, o.rank]));
  const order = [...data.keys()].toSorted(
    (a, b) =>
      (rank.get(data[a]?.owner ?? "") ?? 0) -
        (rank.get(data[b]?.owner ?? "") ?? 0) || a - b
  );
  const slot = new Map<number, number>();
  let next = 0;
  let last: string | undefined;
  for (const i of order) {
    const owner = data[i]?.owner;
    if (last !== undefined && owner !== last) {
      next += GROUP_GAP;
    }
    slot.set(i, next);
    next += 1;
    last = owner;
  }
  return { rows: next, slot };
};

const layoutFor = (
  width: number,
  height: number,
  data: OwnershipDatum[],
  owners: OwnerNode[],
  noteH: number
): Layout => {
  const narrow = width < 460;
  const blockW = Math.min(width - 8, 600);
  const left = Math.round((width - blockW) / 2);
  const { rows, slot } = slotsOf(data, owners);
  // A whole-pixel pitch, so every tick in a stack sits on the pixel grid.
  const pitch = Math.max(
    4,
    Math.floor((height - 12 - noteH) / Math.max(1, rows))
  );
  const top = 8;
  const yItem = (i: number) => top + pitch * (slot.get(i) ?? 0);
  const ownerY = new Map(
    owners.map((o) => {
      const ys = [...data.keys()].flatMap((i) =>
        data[i]?.owner === o.owner ? [yItem(i)] : []
      );
      return [o.owner, (Math.min(...ys) + Math.max(...ys)) / 2];
    })
  );
  const maxCount = owners[0]?.count ?? 1;
  const rMax = narrow ? 12 : 16;
  const rOf = (c: number) => Math.max(3, rMax * Math.sqrt(c / maxCount));
  const reserve = ownerReserve(owners, rOf, narrow ? 108 : 150, blockW);
  const ownerLines = new Map(
    owners.map((o) => [
      o.owner,
      wrapWords(
        ownerText(o),
        reserve - rOf(o.count) - OWNER_GAP - OWNER_EDGE,
        labelWidth
      ),
    ])
  );
  return {
    blockW,
    height: Math.round(top + pitch * (rows - 1) + 12 + noteH),
    left,
    ownerLines,
    pitch,
    rMax,
    rOf,
    xDot: left + DOT_R + 1.5,
    xOwner: left + blockW - reserve,
    xTick0: left,
    xTick1: left + DOT_R * 2 + 2,
    yItem,
    yOwner: (o) => ownerY.get(o) ?? top,
  };
};

interface LayerProps {
  data: OwnershipDatum[];
  owners: OwnerNode[];
  at: Layout;
  focus: Focus | null;
  /** The hero owner: named by `highlight`, else the largest `strong`. */
  isHero: (owner: string) => boolean;
  /** Pattern ids: the owners' hatch and the hero's crosshatch. */
  fills: { hatch: string; hero: string };
  onFocus: (f: Focus) => void;
}

const itemLit = (
  data: OwnershipDatum[],
  focus: Focus | null,
  i: number
): boolean | null => {
  if (focus === null) {
    return null;
  }
  return focus.item === undefined
    ? focus.owner === data[i]?.owner
    : focus.item === i;
};

const ownerLit = (
  data: OwnershipDatum[],
  focus: Focus | null,
  o: string
): boolean | null => {
  if (focus === null) {
    return null;
  }
  return focus.owner === undefined
    ? data[focus.item ?? -1]?.owner === o
    : focus.owner === o;
};

/**
 * One row per repo: a hollow dot in its owner's string, at one even pitch,
 * and a straight hairline from it to the owner, so each owner gathers an
 * even fan. The hero owner's dots and lines are ink.
 */
const Repos = ({ data, at, focus, isHero, onFocus }: LayerProps) => (
  <g>
    {data.map((d, i) => {
      const lit = itemLit(data, focus, i);
      const y = crisp(at.yItem(i));
      const ink = lit === true || isHero(d.owner);
      return (
        <g
          className={`transition-opacity ${lit === false ? "opacity-25" : ""}`}
          key={d.name}
          onPointerEnter={() => {
            onFocus({ item: i });
          }}
        >
          <rect
            fill="transparent"
            height={at.pitch}
            width={at.xOwner - at.rMax - at.xTick0}
            x={at.xTick0}
            y={y - at.pitch / 2}
          />
          <circle
            className={`pop fill-paper transition-colors ${ink ? "stroke-ink" : "stroke-l3"}`}
            cx={at.xDot}
            cy={y}
            r={DOT_R}
            strokeWidth={1}
            style={stagger(i, "dense")}
          />
          <line
            className={`draw transition-colors ${ink ? "stroke-ink" : "stroke-l5"}`}
            pathLength={1}
            strokeWidth={1}
            style={stagger(i, "fine")}
            x1={at.xTick1}
            x2={at.xOwner}
            y1={y}
            y2={at.yOwner(d.owner)}
          />
        </g>
      );
    })}
  </g>
);

interface OwnerLabelProps {
  hero: boolean;
  lines: string[];
  owner: string;
  rank: number;
  x: number;
  y: number;
}

/** The owner's name and count, centred on its node when it wraps. */
const OwnerLabel = ({ hero, lines, owner, rank, x, y }: OwnerLabelProps) => (
  <text
    className={`fade t-label ${hero ? "" : "fill-muted"}`}
    style={stagger(rank + 10)}
    y={y - ((lines.length - 1) * OWNER_LINE) / 2}
  >
    {lines.map((line, k) => (
      <tspan
        dy={k === 0 ? "0.34em" : OWNER_LINE}
        key={`${owner}-${line}`}
        x={x}
      >
        {line}
      </tspan>
    ))}
  </text>
);

/**
 * Each owner a disc whose area is its count: a hatch on paper inside a 1px
 * rule, the hero crosshatched in ink. The disc covers its fan's meeting point.
 */
const Owners = ({
  data,
  owners,
  at,
  focus,
  isHero,
  fills,
  onFocus,
}: LayerProps) => (
  <g>
    {owners.map((o) => {
      const lit = ownerLit(data, focus, o.owner);
      const y = at.yOwner(o.owner);
      const r = at.rOf(o.count);
      const hero = isHero(o.owner);
      return (
        <g
          key={o.owner}
          className={`transition-opacity ${lit === false ? "opacity-30" : ""}`}
          onPointerEnter={() => {
            onFocus({ owner: o.owner });
          }}
        >
          <rect
            x={at.xOwner - at.rMax}
            y={y - Math.max(r, 9)}
            width={at.blockW + at.left - at.xOwner + at.rMax}
            height={Math.max(r, 9) * 2}
            fill="transparent"
          />
          <circle
            className={`pop ${hero ? "stroke-hero" : "stroke-l5"}`}
            cx={at.xOwner}
            cy={y}
            fill={paint(hero ? fills.hero : fills.hatch)}
            r={r}
            strokeWidth={1}
            style={stagger(o.rank + 24, "mark")}
          />
          <OwnerLabel
            hero={hero}
            lines={at.ownerLines.get(o.owner) ?? [ownerText(o)]}
            owner={o.owner}
            rank={o.rank}
            x={at.xOwner + r + OWNER_GAP}
            y={y}
          />
        </g>
      );
    })}
  </g>
);

/**
 * L12 Repo owners. Many-to-one ownership: every repo is a hollow dot, strung
 * at one even pitch and grouped by owner, and each dot runs a straight
 * hairline to its owner on the right, so every owner gathers a clean fan.
 * Owner disc area = how many it owns, engraved; repo names are on hover.
 */
export const TypeColonnade = (props: TypeColonnadeProps) => {
  const data = props.data ?? typeColonnadeDemo;
  const height = props.height ?? 460;
  const strong = props.strong ?? 1;
  const unit = props.unit ?? "items";
  const [focus, setFocus] = useState<Focus | null>(null);
  const owners = tally(data);
  const tex = useTextureIds("owners");
  const fills = { hatch: tex("hatch"), hero: tex("hero") };
  const heroes = new Set(
    props.highlight === undefined
      ? owners.flatMap((o) => (o.rank < strong ? [o.owner] : []))
      : [props.highlight]
  );

  return (
    <Plot>
      {(width) => {
        const at = layoutFor(
          width,
          height,
          data,
          owners,
          noteSpace(props.note, width - 16, 24)
        );
        const layer: LayerProps = {
          at,
          data,
          fills,
          focus,
          isHero: (o) => heroes.has(o),
          onFocus: setFocus,
          owners,
        };
        const focusOwner = focus?.owner;
        const focusItem =
          focus?.item === undefined ? undefined : data[focus.item];
        return (
          <div className="relative">
            <svg
              width={width}
              height={at.height}
              aria-label={`${data.length} ${unit} across ${owners.length} owners: ${owners.map((o) => `${o.owner} ${o.count}`).join(", ")}`}
              onPointerLeave={() => {
                setFocus(null);
              }}
            >
              <title>Ownership</title>
              <defs>
                <Hatch ground="fill-paper" id={fills.hatch} tone="fill-l4" />
                <CrossHatch
                  ground="fill-paper"
                  id={fills.hero}
                  tone="fill-hero"
                />
              </defs>
              <Repos {...layer} />
              <Owners {...layer} />
              <PlotNote
                text={props.note}
                width={width - 16}
                x={width / 2}
                y={at.height - 6}
              />
            </svg>
            {focusOwner !== undefined && (
              <Tooltip
                x={at.xOwner}
                y={
                  at.yOwner(focusOwner) -
                  at.rOf(
                    owners.find((o) => o.owner === focusOwner)?.count ?? 1
                  ) -
                  4
                }
              >
                <b>{focusOwner}</b> ·{" "}
                {owners.find((o) => o.owner === focusOwner)?.count ?? 0} {unit}
              </Tooltip>
            )}
            {focusItem !== undefined && focus?.item !== undefined && (
              <Tooltip x={at.xTick1} y={at.yItem(focus.item) - 6}>
                <b>{focusItem.name}</b> · owned by {focusItem.owner}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
