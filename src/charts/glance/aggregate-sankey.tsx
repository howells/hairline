import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyGraph, SankeyNode } from "d3-sankey";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch, Rules, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import {
  dimClass,
  noteSpace,
  ranks,
  sansWidth,
  stagger,
  wrapWords,
} from "../util";
import { aggregateSankeyDemo } from "./aggregate-sankey.data";
import type { AggregateSankeyData, SankeyFlow } from "./aggregate-sankey.data";

interface AggregateSankeyProps {
  data?: AggregateSankeyData;
  height?: number;
  format?: (v: number) => string;
  /** Unit noun for the tooltip, e.g. "accounts". */
  unit?: string;
  note?: string;
  /** Source label to keep in the hero colour. */
  highlight?: string;
}

interface NodeExtra {
  id: string;
  index: number;
  name: string;
  side: "source" | "target";
}

interface LinkExtra {
  from: string;
  to: string;
}

/** What the pointer is on: a node (by name) or a flow (by index). */
interface Focus {
  flow: number | null;
  node: string | null;
  x: number;
  y: number;
}

type Graph = SankeyGraph<NodeExtra, LinkExtra>;

const round = (v: number) => `${Math.round(v)}`;

/**
 * Engraving grammar for the sources after the hero, top to bottom: each
 * keeps its own texture, and neighbouring hatches lean opposite ways.
 */
const GRAIN = ["falling", "rising", "dots", "rule"] as const;

/** Node bar to label, and label to the svg edge. */
const LABEL_GAP = 12;
const LABEL_EDGE = 4;
const LABEL_LINE = 13;

/** Width of a node label in the 12px label role. */
const labelWidth = (text: string) => sansWidth(text, 12);

interface Margins {
  left: number;
  right: number;
  /** Source label lines by name: "NAME · VALUE", or the name wrapped over the value. */
  sourceLines: Map<string, string[]>;
}

/**
 * Side margins sized from the labels: never less than the defaults (128 and
 * 92, or 84 and 52 narrow), and grown to fit the longest name. Source labels
 * that would take more than ~40% of the width wrap, the value on its own line.
 */
const labelMargins = (
  data: AggregateSankeyData,
  width: number,
  narrow: boolean,
  valueOf: (name: string) => string
): Margins => {
  const cap = Math.max(narrow ? 84 : 128, width * 0.4);
  const room = cap - LABEL_GAP - LABEL_EDGE;
  const sourceLines = new Map(
    data.sources.map((name) => {
      const full = `${name} · ${valueOf(name)}`;
      const lines =
        labelWidth(full) <= room
          ? [full]
          : [...wrapWords(name, room, labelWidth), valueOf(name)];
      return [name, lines] as const;
    })
  );
  const widest = Math.max(
    0,
    ...[...sourceLines.values()].flat().map((l) => labelWidth(l))
  );
  // Target labels carry their total inline: "Free 55".
  const widestTarget = Math.max(
    0,
    ...data.targets.map((t) => labelWidth(`${t} ${valueOf(t)}`) + 6)
  );
  return {
    left: Math.max(
      narrow ? 84 : 128,
      Math.ceil(widest) + LABEL_GAP + LABEL_EDGE
    ),
    right: Math.max(
      narrow ? 52 : 92,
      Math.ceil(widestTarget) + LABEL_GAP + LABEL_EDGE
    ),
    sourceLines,
  };
};

const layoutGraph = (
  data: AggregateSankeyData,
  width: number,
  height: number,
  narrow: boolean,
  bottom: number,
  margins: Margins
): Graph => {
  const m = { left: margins.left, right: margins.right, top: 8 };
  const nodes: NodeExtra[] = [
    ...data.sources.map((name, index) => ({
      id: `s:${name}`,
      index,
      name,
      side: "source" as const,
    })),
    ...data.targets.map((name, index) => ({
      id: `t:${name}`,
      index,
      name,
      side: "target" as const,
    })),
  ];
  const links = data.flows.map((f) => ({
    from: f.from,
    source: `s:${f.from}`,
    target: `t:${f.to}`,
    to: f.to,
    value: f.value,
  }));
  return sankey<NodeExtra, LinkExtra>()
    .nodeId((d) => d.id)
    .nodeWidth(narrow ? 10 : 15)
    .nodePadding(narrow ? 12 : 16)
    .nodeSort((a, b) => a.index - b.index)
    .extent([
      [m.left, m.top],
      [width - m.right, height - bottom],
    ])({ links, nodes });
};

const isLit = (focus: Focus | null, f: SankeyFlow, k: number) => {
  if (focus === null) {
    return true;
  }
  if (focus.flow !== null) {
    return focus.flow === k;
  }
  return f.from === focus.node || f.to === focus.node;
};

/** Engraved ribbons at rest; hover inks the traced ones solid and drops the rest to 25%. */
const ribbonTone = (focus: Focus | null, lit: boolean) => {
  if (focus === null) {
    return { face: "", ribbon: "" };
  }
  return lit
    ? { face: "stroke-l3", ribbon: "" }
    : { face: "", ribbon: "opacity-25" };
};

const nodeLit = (
  focus: Focus | null,
  data: AggregateSankeyData,
  name: string
) => {
  if (focus === null || focus.node === name) {
    return true;
  }
  if (focus.flow === null) {
    return false;
  }
  const flow = data.flows[focus.flow];
  return flow.from === name || flow.to === name;
};

interface RibbonsProps {
  data: AggregateSankeyData;
  focus: Focus | null;
  graph: Graph;
  /** Pattern id for each source's ribbons and node. */
  grainOf: (source: string) => string;
  /** Pattern id of the hero source, laid on top. */
  heroGrain: string;
  midX: number;
  onFocus: (focus: Focus) => void;
}

/**
 * One engraved ribbon per flow, drawn in left to right: its source's texture
 * on paper inside a 1px l5 rim (an l5 underlay 2px wider), so a ribbon
 * cleanly covers the one it crosses instead of mixing two screens. The hero
 * source's crosshatched ribbons are laid over the rest.
 */
const Ribbons = (p: RibbonsProps) => {
  const ribbon = sankeyLinkHorizontal<NodeExtra, LinkExtra>();
  const order = p.graph.links
    .map((l, k) => ({ k, l }))
    .toSorted(
      (a, b) =>
        Number(p.grainOf(a.l.from) === p.heroGrain) -
        Number(p.grainOf(b.l.from) === p.heroGrain)
    );
  return (
    <g>
      {order.map(({ l, k }) => {
        const tone = ribbonTone(p.focus, isLit(p.focus, p.data.flows[k], k));
        return (
          <g
            key={`${l.from}-${l.to}`}
            className={`fill-none ${tone.ribbon}`}
            onPointerEnter={() => {
              p.onFocus({
                flow: k,
                node: null,
                x: p.midX,
                y: ((l.y0 ?? 0) + (l.y1 ?? 0)) / 2 - (l.width ?? 0) / 2 - 4,
              });
            }}
          >
            <path
              className="draw stroke-l5"
              d={ribbon(l) ?? ""}
              pathLength={1}
              strokeWidth={Math.max(3, l.width ?? 1)}
              style={stagger(k, "mark")}
            />
            <path
              className={`draw transition-tone ${tone.face}`}
              d={ribbon(l) ?? ""}
              pathLength={1}
              stroke={paint(p.grainOf(l.from))}
              strokeWidth={Math.max(1, (l.width ?? 1) - 2)}
              style={stagger(k, "mark")}
            />
          </g>
        );
      })}
    </g>
  );
};

interface NodeProps {
  fill: string;
  /** Engraved pattern fill for a source node; omit for a solid bar. */
  pattern?: string;
  i: number;
  /** Source label lines; the last is the value when the label wraps. */
  lines: string[];
  lit: boolean;
  node: SankeyNode<NodeExtra, LinkExtra>;
  onEnter: (focus: Focus) => void;
  valueText: string;
}

interface SourceLabelProps {
  lines: string[];
  name: string;
  valueText: string;
  x: number;
  y: number;
}

/** "Name · value" right-aligned to the bar, or the name wrapped over the value. */
const SourceLabel = (p: SourceLabelProps) => {
  if (p.lines.length === 1) {
    return (
      <text className="t-label" x={p.x} y={p.y} dy="0.36em" textAnchor="end">
        {p.name}
        <tspan className="fill-muted"> · {p.valueText}</tspan>
      </text>
    );
  }
  return (
    <text
      className="t-label"
      y={p.y - ((p.lines.length - 1) * LABEL_LINE) / 2}
      textAnchor="end"
    >
      {p.lines.map((line, k) => (
        <tspan
          className={k === p.lines.length - 1 ? "fill-muted" : undefined}
          dy={k === 0 ? "0.36em" : LABEL_LINE}
          key={`${p.name}-${line}`}
          x={p.x}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
};

/** A node bar plus its label: "name · value" on the left, "name value" on the right. */
const NodeMark = (p: NodeProps) => {
  const x0 = p.node.x0 ?? 0;
  const x1 = p.node.x1 ?? 0;
  const y0 = p.node.y0 ?? 0;
  const y1 = p.node.y1 ?? 0;
  const mid = (y0 + y1) / 2;
  return (
    <g
      className={dimClass(!p.lit)}
      onPointerEnter={() => {
        p.onEnter({
          flow: null,
          node: p.node.name,
          x: (x0 + x1) / 2,
          y: y0 - 6,
        });
      }}
    >
      <rect
        className={`grow-y ${p.fill}`}
        style={stagger(p.i, "mark")}
        x={p.pattern === undefined ? x0 : crisp(x0)}
        y={p.pattern === undefined ? y0 : crisp(y0)}
        width={Math.round(x1 - x0) - (p.pattern === undefined ? 0 : 1)}
        height={Math.max(2, Math.round(y1 - y0) - 1)}
        rx={2}
        fill={p.pattern}
        strokeWidth={1}
      />
      {p.node.side === "source" ? (
        <SourceLabel
          lines={p.lines}
          name={p.node.name}
          valueText={p.valueText}
          x={x0 - LABEL_GAP}
          y={mid}
        />
      ) : (
        <text className="t-label" x={x1 + LABEL_GAP} y={mid} dy="0.36em">
          {p.node.name}
          <tspan className="t-value" dx={6}>
            {p.valueText}
          </tspan>
        </text>
      )}
    </g>
  );
};

/** The grains: the hero's crosshatch, then the rest in GRAIN order, all on paper. */
const GrainDefs = ({ tex }: { tex: (name: string) => string }) => (
  <defs>
    <CrossHatch ground="fill-paper" id={tex("cross")} tone="fill-l3" />
    <Hatch
      angle="falling"
      ground="fill-paper"
      id={tex("falling")}
      tone="fill-l4"
    />
    <Hatch ground="fill-paper" id={tex("rising")} tone="fill-l4" />
    <Stipple ground="fill-paper" id={tex("dots")} tone="fill-l3" />
    <Rules ground="fill-paper" id={tex("rule")} tone="fill-l4" />
  </defs>
);

/**
 * G22 Channel to plan. Two columns: sources on the left, destinations on
 * the right; ribbon width = amount. Each source's ribbons are engraved in
 * its own grain on paper (hatches leaning alternately, then stipple and
 * rules), keyed by its node bar; the biggest source (or the highlight) is
 * the one ink node and its ribbons are crosshatched and laid on top. A
 * crossing ribbon covers the one beneath, so screens never mix into moiré.
 * Target totals sit inline with their names. Hover a node or a ribbon to
 * trace it.
 */
export const AggregateSankey = (props: AggregateSankeyProps) => {
  const data = props.data ?? aggregateSankeyDemo;
  const height = props.height ?? 420;
  const format = props.format ?? round;
  const unit = props.unit ?? "accounts";
  const [focus, setFocus] = useState<Focus | null>(null);
  const srcRank = ranks(
    data.sources.map((s) =>
      data.flows.filter((f) => f.from === s).reduce((a, f) => a + f.value, 0)
    )
  );
  const tex = useTextureIds("flow");
  const heroSource = props.highlight ?? data.sources[srcRank.indexOf(0)] ?? "";
  // Sources after the hero, top to bottom, each take the next grain.
  const rest = data.sources.filter((name) => name !== heroSource);
  const heroGrain = tex("cross");
  const grainOf = (source: string) =>
    source === heroSource
      ? heroGrain
      : tex(GRAIN[rest.indexOf(source) % GRAIN.length]);
  const nodeFill = (n: { name: string; side: "source" | "target" }) => {
    if (n.side === "target") {
      return "fill-l4";
    }
    return n.name === heroSource ? "fill-hero" : "stroke-l5";
  };
  const total = (name: string) =>
    data.flows
      .filter((f) => f.from === name || f.to === name)
      .reduce((a, f) => a + f.value, 0);
  const label = `Flows from ${data.sources.join(", ")} into ${data.targets.join(", ")}`;

  return (
    <Plot
      overlay={
        focus === null ? null : (
          <Tooltip x={focus.x} y={focus.y}>
            {focus.flow === null ? (
              <>
                <b>{focus.node}</b> · {format(total(focus.node ?? ""))} {unit}
              </>
            ) : (
              <>
                <b>
                  {data.flows[focus.flow].from} → {data.flows[focus.flow].to}
                </b>{" "}
                · {format(data.flows[focus.flow].value)} {unit}
              </>
            )}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 480;
        const bottom = 8 + noteSpace(props.note, width - 16, 32);
        const margins = labelMargins(data, width, narrow, (name) =>
          format(total(name))
        );
        const graph = layoutGraph(data, width, height, narrow, bottom, margins);

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setFocus(null);
            }}
          >
            <title>{label}</title>
            <GrainDefs tex={tex} />
            <Ribbons
              data={data}
              focus={focus}
              graph={graph}
              grainOf={grainOf}
              heroGrain={heroGrain}
              midX={width / 2}
              onFocus={setFocus}
            />
            {graph.nodes.map((n, i) => (
              <NodeMark
                key={n.id}
                fill={nodeFill(n)}
                pattern={
                  n.side === "source" && n.name !== heroSource
                    ? paint(grainOf(n.name))
                    : undefined
                }
                i={i}
                lines={margins.sourceLines.get(n.name) ?? []}
                lit={nodeLit(focus, data, n.name)}
                node={n}
                onEnter={setFocus}
                valueText={format(n.value ?? 0)}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
