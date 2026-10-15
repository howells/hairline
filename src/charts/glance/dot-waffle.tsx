import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch, KeySwatch, Rules, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, ranks, stagger } from "../util";
import { dotWaffleDemo } from "./dot-waffle.data";
import type { WaffleDatum } from "./dot-waffle.data";
import { labelRoom } from "./util-a";

interface DotWaffleProps {
  data?: WaffleDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Footnote under the grid. */
  note?: string;
  /** Index of the category to draw in the hero colour. */
  highlight?: number;
}

interface Tip {
  i: number;
  x: number;
  y: number;
}

interface Dot {
  id: string;
  owner: number;
  cx: number;
  cy: number;
  order: number;
}

/** Height of one legend line. */
const LEGEND_ROW = 28;
/** Side of a legend swatch (KeySwatch). */
const SWATCH = 12;

/**
 * The engraving grammar, densest first, for every category after the hero:
 * crosshatch, hatch, fine rules, stipple. Any further category is a bare
 * outline.
 */
const GRAMMAR = ["cross", "hatch", "rule", "dots"] as const;

interface Look {
  /** Classes for the cell: a solid fill, or the outline tone. */
  className: string;
  /** Pattern fill, when engraved. */
  fill?: string;
  /** True when the cell is outlined (and so sits on half pixels). */
  outlined: boolean;
}

/** How category `k` of the grammar is drawn: 0 is the solid hero. */
const lookOf = (k: number, tex: (name: string) => string): Look => {
  if (k === 0) {
    return { className: "fill-hero", outlined: false };
  }
  const g = GRAMMAR.at(k - 1);
  return g === undefined
    ? { className: "stroke-l5 fill-paper", outlined: true }
    : { className: "stroke-l5", fill: paint(tex(g)), outlined: true };
};

/** Grammar slot per category: the hero (highlight, else the largest) first, the rest by share. */
const slotsFor = (values: number[], highlight: number | undefined) => {
  const rank = ranks(values);
  const hero = highlight ?? rank.indexOf(0);
  return rank.map((r, i) => {
    if (i === hero) {
      return 0;
    }
    return r < rank[hero] ? r + 1 : r;
  });
};

/** Largest-remainder rounding: whole dots that always add up to `total`. */
const apportion = (values: number[], total: number) => {
  const sum = values.reduce((a, b) => a + b, 0);
  const exact = values.map((v) => (sum > 0 ? (v / sum) * total : 0));
  const out = exact.map((e) => Math.floor(e));
  const left = total - out.reduce((a, b) => a + b, 0);
  const order = exact
    .map((e, i) => ({ i, r: e - Math.floor(e) }))
    .toSorted((a, b) => b.r - a.r);
  for (let k = 0; k < left; k += 1) {
    out[order[k % order.length].i] += 1;
  }
  return out;
};

const defaultFormat = (v: number) => `${v}%`;

/** Width of one legend entry: swatch, widest name, a gap and the widest share; at least 130. */
const entryWidth = (data: WaffleDatum[], format: (v: number) => string) =>
  Math.max(
    130,
    SWATCH +
      10 +
      labelRoom(
        data.map((d) => d.label),
        "t-label"
      ) +
      16 +
      labelRoom(
        data.map((d) => format(d.value)),
        "t-value"
      ) +
      8
  );

interface LegendProps {
  data: WaffleDatum[];
  /** How each category is drawn. */
  looks: Look[];
  format: (v: number) => string;
  hover: number | null;
  /** Position of entry i. */
  at: (i: number) => { x: number; y: number };
  /** Width of one entry; the value sits flush right inside it. */
  hitWidth: number;
  /** Gap between the value and the end of its entry. */
  inset: number;
  onEnter: (i: number, x: number, y: number) => void;
}

/** One line per category: swatch, name, and the share flush right. */
const WaffleLegend = (props: LegendProps) => (
  <g>
    {props.data.map((d, i) => {
      const { x, y } = props.at(i);
      return (
        <g
          key={d.label}
          className={dimClass(props.hover !== null && props.hover !== i)}
          onPointerEnter={() => {
            props.onEnter(i, x + props.hitWidth / 2, y - 10);
          }}
        >
          <g className="fade" style={stagger(i + 6, "series")}>
            <rect
              x={x}
              y={y - LEGEND_ROW / 2}
              width={props.hitWidth}
              height={LEGEND_ROW}
              fill="transparent"
            />
            <KeySwatch
              fill={props.looks[i].fill}
              tone={
                props.looks[i].fill === undefined
                  ? props.looks[i].className
                  : undefined
              }
              x={x}
              y={y - SWATCH / 2}
            />
            <text className="t-name" x={x + SWATCH + 8} y={y} dy="0.35em">
              {d.label}
            </text>
            <text
              className="t-value"
              x={x + props.hitWidth - props.inset}
              y={y}
              dy="0.35em"
              textAnchor="end"
            >
              {props.format(d.value)}
            </text>
          </g>
        </g>
      );
    })}
  </g>
);

interface CellsProps {
  dots: Dot[];
  hover: number | null;
  looks: Look[];
  onEnter: (i: number, x: number, y: number) => void;
  side: number;
}

/** The 10 × 10 grid; engraved cells sit on half pixels so their outline is crisp. */
const WaffleCells = ({ dots, hover, looks, onEnter, side }: CellsProps) => (
  <g>
    {dots.map((d) => {
      const look = looks[d.owner];
      const inset = look.outlined ? 0.5 : 0;
      return (
        <rect
          key={d.id}
          className={`pop ${look.className} ${dimClass(hover !== null && hover !== d.owner)}`}
          style={stagger(d.order, "dense")}
          x={Math.round(d.cx - side / 2) + inset}
          y={Math.round(d.cy - side / 2) + inset}
          width={side - inset * 2}
          height={side - inset * 2}
          rx={2}
          fill={look.fill}
          strokeWidth={1}
          onPointerEnter={() => {
            onEnter(d.owner, d.cx, d.cy - side / 2 - 2);
          }}
        />
      );
    })}
  </g>
);

/**
 * G4 Pollen in honey. A 10 × 10 grid of small squares, one square = 1% of the
 * whole, filled row by row in data order. The largest share is solid ink;
 * each other category is engraved in its own grammar (crosshatch, hatch,
 * rules, stipple) inside a crisp outline. The legend is one line per
 * category, its share flush right.
 */
export const DotWaffle = (props: DotWaffleProps) => {
  const data = props.data ?? dotWaffleDemo;
  const height = props.height ?? 340;
  const format = props.format ?? defaultFormat;
  const [tip, setTip] = useState<Tip | null>(null);
  const hover = tip === null ? null : tip.i;
  const tex = useTextureIds("waffle");
  const looks = slotsFor(
    data.map((d) => d.value),
    props.highlight
  ).map((k) => lookOf(k, tex));
  const owners = apportion(
    data.map((d) => d.value),
    100
  ).flatMap((c, i) => Array.from({ length: c }, () => i));
  const label = `Share of the pollen in honey, one square for each per cent: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`;
  const enter = (i: number, x: number, y: number) => {
    setTip({ i, x, y });
  };

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 460;
        const entryW = narrow ? 0 : entryWidth(data, format);
        const legendW = narrow ? 0 : entryW + 20;
        const noteH = noteSpace(props.note, width - 16, 22);
        const legendRows = narrow ? Math.ceil(data.length / 2) : 0;
        const pitch =
          Math.min(
            height - 8 - noteH - legendRows * LEGEND_ROW,
            width - legendW - 16,
            300
          ) / 10;
        const side = Math.round(pitch * 0.74);
        const gridW = pitch * 10;
        const gx = (width - gridW - legendW) / 2;
        const svgH = narrow
          ? gridW + 20 + legendRows * LEGEND_ROW + noteH
          : height;
        const legendGap = Math.min(LEGEND_ROW, (gridW - 8) / data.length);
        const dots: Dot[] = owners.map((owner, k) => ({
          cx: gx + ((k % 10) + 0.5) * pitch,
          cy: 4 + (Math.floor(k / 10) + 0.5) * pitch,
          id: `dot-${k}`,
          order: k,
          owner,
        }));
        const at = (i: number) =>
          narrow
            ? {
                x: (i % 2) * ((width + 16) / 2),
                y: gridW + 26 + Math.floor(i / 2) * LEGEND_ROW,
              }
            : { x: gx + gridW + 28, y: 4 + pitch * 0.5 + i * legendGap };

        return (
          <svg
            width={width}
            height={svgH}
            aria-label={label}
            onPointerLeave={() => {
              setTip(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <CrossHatch
                ground="fill-paper"
                id={tex("cross")}
                tone="fill-l2"
              />
              <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l3" />
              <Rules ground="fill-paper" id={tex("rule")} tone="fill-l3" />
              <Stipple ground="fill-paper" id={tex("dots")} tone="fill-l3" />
            </defs>
            <WaffleCells
              dots={dots}
              hover={hover}
              looks={looks}
              onEnter={enter}
              side={side}
            />
            <WaffleLegend
              data={data}
              looks={looks}
              format={format}
              hover={hover}
              at={at}
              hitWidth={narrow ? (width - 16) / 2 : entryW}
              inset={narrow ? 0 : 8}
              onEnter={enter}
            />
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={svgH - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
