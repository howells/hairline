import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { SankeyLink, SankeyNode } from "d3-sankey";
import { useState } from "react";

import { fmtInt } from "../../lib/format";
import { Chart } from "../core";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { LABEL, TICK, VALUE } from "./styles";

/**
 * Links are engraved ribbons: a hatch on paper, darker on the traced path.
 * Each key has its hatch tone and the solid used when a link is too thin.
 */
const LINK_INK = {
  link: { solid: "var(--l4)", tone: "fill-l4" },
  "link-alert": { solid: "var(--alert)", tone: "fill-alert" },
  "link-hot": { solid: "var(--l3)", tone: "fill-l3" },
} as const;
type LinkKey = keyof typeof LINK_INK;
const LINK_KEYS: LinkKey[] = ["link", "link-alert", "link-hot"];

interface NodeIn {
  id: string;
  label: string;
  stage: number;
  alert?: boolean;
}
interface LinkIn {
  source: string;
  target: string;
  value: number;
}
interface FunnelData {
  nodes: NodeIn[];
  links: LinkIn[];
  stages: string[];
}
/**
 * Each link keeps its endpoint ids as `from`/`to`: d3-sankey replaces
 * `source`/`target` with node objects during layout, but leaves extra fields
 * alone.
 */
interface LinkEnds {
  from: string;
  to: string;
}
type FunnelNode = SankeyNode<NodeIn, LinkEnds>;
type FunnelLink = SankeyLink<NodeIn, LinkEnds>;

const linkKey = (l: LinkEnds) => `${l.from}>${l.to}`;

const linkTexture = (alert: boolean, hot: boolean): LinkKey => {
  if (alert) {
    return "link-alert";
  }
  return hot ? "link-hot" : "link";
};

/** Thinner than this, a hatch breaks into dots; such links stay solid. */
const MIN_HATCH = 4;

const linkPaint = (
  tex: (name: string) => string,
  key: LinkKey,
  width: number
) => (width < MIN_HATCH ? LINK_INK[key].solid : paint(tex(key)));

/** Links off the hovered path recede; at rest every link is solid. */
const linkOpacity = (lit: boolean) => (lit ? 1 : 0.3);

/** Where a node's label sits: beside it (final stage), or stacked over or under it. */
type Placement = "above" | "raised" | "below" | "beside";

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Approximate glyph advance, px: node names, node values, stage headings. */
const NAME_CHAR = 6.6;
const VALUE_CHAR = 7.4;
const STAGE_CHAR = 6.2;
/** Clear space kept between neighbouring labels, px. */
const LABEL_GAP = 4;
/** Top margin: room for the stage headings and the labels over the top nodes. */
const TOP = 70;
/** Crowded funnels stack headings in two rows and labels in two tiers. */
const TOP_CROWDED = 92;
const HEADING_Y = [12, 26];
/** Baseline of the name line, from the node's top (or bottom, for "below"). */
const NAME_DY = { above: -21, below: 15, raised: -47 };
/** The value line sits this far under the name line. */
const VALUE_DY = 14;

const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 + LABEL_GAP &&
  b.x0 < a.x1 + LABEL_GAP &&
  a.y0 < b.y1 &&
  b.y0 < a.y1;

const nodeBox = (n: FunnelNode): Box => ({
  x0: n.x0 ?? 0,
  x1: n.x1 ?? 0,
  y0: n.y0 ?? 0,
  y1: Math.max((n.y0 ?? 0) + 2, n.y1 ?? 0),
});

const valueText = (n: FunnelNode) => fmtInt(n.value ?? 0);

/** The area a node's label covers in a given placement. */
const labelBox = (n: FunnelNode, placement: Placement): Box => {
  const { x0, x1, y0, y1 } = nodeBox(n);
  const name = n.label.length * NAME_CHAR;
  const value = valueText(n).length * VALUE_CHAR;
  if (placement === "beside") {
    const mid = (y0 + y1) / 2;
    const left = x1 + 10;
    return {
      x0: left,
      x1: left + name + NAME_CHAR + value,
      y0: mid - 7,
      y1: mid + 7,
    };
  }
  const nameY = (placement === "below" ? y1 : y0) + NAME_DY[placement];
  return {
    x0,
    x1: x0 + Math.max(name, value),
    y0: nameY - 9,
    y1: nameY + VALUE_DY + 3,
  };
};

/**
 * Where a flow ends (the final stage, or a drop-off before it) nothing leaves
 * the node, so its label sits beside it on the right; the rest stack above.
 */
const endsHere = (n: FunnelNode, lastStage: number) =>
  n.stage === lastStage || (n.sourceLinks?.length ?? 0) === 0;

const defaultPlacement = (n: FunnelNode, lastStage: number): Placement =>
  endsHere(n, lastStage) ? "beside" : "above";

/** Whether a label box hits another label or any node but its own. */
const collides = (
  box: Box,
  self: FunnelNode,
  nodes: FunnelNode[],
  labels: Box[]
) =>
  labels.some((b) => overlaps(b, box)) ||
  nodes.some((n) => n.id !== self.id && overlaps(nodeBox(n), box));

/** Whether any stage heading runs into the next one. */
const headingsCollide = (stages: string[], stageX: number[]) =>
  stages.some(
    (stage, i) =>
      i < stages.length - 1 &&
      stageX[i] + stage.length * STAGE_CHAR + LABEL_GAP > stageX[i + 1]
  );

const labelsCollide = (nodes: FunnelNode[], lastStage: number) => {
  const boxes = nodes.map((n) => labelBox(n, defaultPlacement(n, lastStage)));
  return nodes.some((n, i) =>
    collides(
      boxes[i],
      n,
      nodes,
      boxes.filter((_, j) => j !== i)
    )
  );
};

/**
 * Where a crowded label may go, in order of preference. A drop-off before the
 * last stage can fall back under its node, where its two short lines fit.
 */
const placementOptions = (n: FunnelNode, lastStage: number): Placement[] => {
  if (n.stage === lastStage) {
    return ["beside"];
  }
  return endsHere(n, lastStage)
    ? ["beside", "below", "above"]
    : ["above", "raised", "below"];
};

/** Final-stage labels first, then other flow ends, then left to right. */
const placementOrder = (a: FunnelNode, b: FunnelNode, lastStage: number) => {
  const rank = (n: FunnelNode) => {
    if (n.stage === lastStage) {
      return -2;
    }
    return endsHere(n, lastStage) ? -1 : n.stage;
  };
  return rank(a) - rank(b) || (a.y0 ?? 0) - (b.y0 ?? 0);
};

/**
 * Greedy label placement for crowded funnels: each label takes the first
 * spot (over its node, a tier higher, or under it) that hits nothing placed.
 */
const placeLabels = (
  nodes: FunnelNode[],
  lastStage: number,
  height: number
) => {
  const placed: Box[] = [];
  const result = new Map<string, Placement>();
  for (const n of nodes.toSorted((a, b) => placementOrder(a, b, lastStage))) {
    const options = placementOptions(n, lastStage);
    const fits = (p: Placement) => {
      const box = labelBox(n, p);
      return (
        box.y0 >= 0 && box.y1 <= height && !collides(box, n, nodes, placed)
      );
    };
    const choice = options.find(fits) ?? options[0];
    result.set(n.id, choice);
    placed.push(labelBox(n, choice));
  }
  return result;
};

const layoutFunnel = (
  data: FunnelData,
  width: number,
  height: number,
  top: number
) => {
  const m = { bottom: 8, left: 4, right: 96, top };
  return sankey<NodeIn, LinkEnds>()
    .nodeId((n) => n.id)
    .nodeAlign((n) => n.stage)
    .nodeWidth(6)
    .nodePadding(40)
    .nodeSort(null)
    .linkSort(null)
    .extent([
      [m.left, m.top],
      [width - m.right, height - m.bottom],
    ])({
    links: data.links.map((l) => ({ ...l, from: l.source, to: l.target })),
    nodes: data.nodes.map((n) => ({ ...n })),
  });
};

const FunnelLinks = (props: {
  tex: (name: string) => string;
  links: FunnelLink[];
  nodes: FunnelNode[];
  hover: string | null;
  onHover: (key: string) => void;
}) => {
  const { hover } = props;
  const isLit = (l: FunnelLink) =>
    hover === null ||
    hover === linkKey(l) ||
    hover === l.from ||
    hover === l.to;
  const alerts = new Set(
    props.nodes.flatMap((n) => (n.alert === true ? [n.id] : []))
  );
  return (
    <g className="fade">
      {props.links.map((l) => {
        const alert = alerts.has(l.to);
        const lit = isLit(l);
        const key = linkKey(l);
        return (
          <path
            key={key}
            d={sankeyLinkHorizontal()(l) ?? ""}
            fill="none"
            stroke={linkPaint(
              props.tex,
              linkTexture(alert, hover !== null && lit),
              l.width ?? 1
            )}
            opacity={linkOpacity(lit)}
            strokeWidth={Math.max(1, l.width ?? 1)}
            className="transition-tone"
            onPointerEnter={() => {
              props.onHover(key);
            }}
          />
        );
      })}
    </g>
  );
};

/** Labels at flow ends sit beside the node; the rest stack over (or under) it. */
const NodeLabel = (props: { node: FunnelNode; placement: Placement }) => {
  const { node, placement } = props;
  const x0 = node.x0 ?? 0;
  const x1 = node.x1 ?? 0;
  const y0 = node.y0 ?? 0;
  const y1 = node.y1 ?? 0;
  const valueClass = VALUE;
  const name = node.label;
  if (placement === "beside") {
    return (
      <text
        className={`${LABEL} fade fill-text`}
        x={x1 + 10}
        y={(y0 + y1) / 2}
        dy="0.34em"
      >
        <tspan fill="var(--muted)">{name} </tspan>
        <tspan className={valueClass}>{valueText(node)}</tspan>
      </text>
    );
  }
  const nameY =
    (placement === "below" ? Math.max(y0 + 2, y1) : y0) + NAME_DY[placement];
  return (
    <text className={`${LABEL} t-halo fade fill-text`} x={x0}>
      <tspan fill="var(--muted)" y={nameY}>
        {name}
      </tspan>
      <tspan className={valueClass} x={x0} y={nameY + VALUE_DY}>
        {valueText(node)}
      </tspan>
    </text>
  );
};

/** Node fill: red for an alert, ink for the hero, grey for the rest. */
const nodeFill = (n: FunnelNode, heroId: string | undefined) => {
  if (n.alert === true) {
    return "var(--alert)";
  }
  return n.id === heroId ? "var(--ink)" : "var(--l3)";
};

/** The hero: the largest final-stage node that is not an alert. */
const heroNode = (nodes: FunnelNode[], lastStage: number) =>
  nodes
    .filter((n) => n.stage === lastStage && n.alert !== true)
    .toSorted((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]?.id;

const FunnelNodes = (props: {
  nodes: FunnelNode[];
  placements: Map<string, Placement>;
  lastStage: number;
  onHover: (id: string) => void;
}) => {
  const heroId = heroNode(props.nodes, props.lastStage);
  return props.nodes.map((n, i) => {
    const x0 = n.x0 ?? 0;
    const x1 = n.x1 ?? 0;
    const y0 = n.y0 ?? 0;
    const y1 = n.y1 ?? 0;
    return (
      <g
        key={n.id}
        onPointerEnter={() => {
          props.onHover(n.id);
        }}
      >
        <rect
          className="grow-y"
          style={{ "--i": i * 3 }}
          x={x0}
          y={y0}
          width={x1 - x0}
          height={Math.max(2, y1 - y0)}
          fill={nodeFill(n, heroId)}
        />
        <NodeLabel
          node={n}
          placement={
            props.placements.get(n.id) ?? defaultPlacement(n, props.lastStage)
          }
        />
      </g>
    );
  });
};

const stageXs = (data: FunnelData, nodes: FunnelNode[]) =>
  data.stages.map((_, s) => nodes.find((n) => n.stage === s)?.x0 ?? 0);

/**
 * The funnel's layout. When stage headings or node labels would collide
 * (narrow plots), headings split into two rows and labels are placed one by
 * one around their nodes; otherwise every label sits in its usual spot.
 */
const funnelLayout = (data: FunnelData, width: number, height: number) => {
  const lastStage = data.stages.length - 1;
  const graph = layoutFunnel(data, width, height, TOP);
  const crowded =
    headingsCollide(data.stages, stageXs(data, graph.nodes)) ||
    labelsCollide(graph.nodes, lastStage);
  if (!crowded) {
    return { crowded, graph, placements: new Map<string, Placement>() };
  }
  const tight = layoutFunnel(data, width, height, TOP_CROWDED);
  return {
    crowded,
    graph: tight,
    placements: placeLabels(tight.nodes, lastStage, height),
  };
};

/** Funnel flow, the goal node inked. Hovering a node or link traces it; the rest recede. */
export const Sankey = (props: {
  data: FunnelData;
  height: number;
  label: string;
}) => {
  const [hover, setHover] = useState<string | null>(null);
  const tex = useTextureIds("sk");

  return (
    <Chart>
      {(width) => {
        const { crowded, graph, placements } = funnelLayout(
          props.data,
          width,
          props.height
        );
        const stageX = stageXs(props.data, graph.nodes);

        return (
          <svg
            width={width}
            height={props.height}
            aria-label={props.label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{props.label}</title>
            <defs>
              {LINK_KEYS.map((key) => (
                <Hatch
                  key={key}
                  ground="fill-paper"
                  id={tex(key)}
                  tone={LINK_INK[key].tone}
                />
              ))}
            </defs>
            {props.data.stages.map((s, i) => (
              <text
                key={s}
                className={TICK}
                x={stageX[i]}
                y={HEADING_Y[crowded ? i % 2 : 0]}
              >
                {s}
              </text>
            ))}
            <FunnelLinks
              tex={tex}
              links={graph.links}
              nodes={graph.nodes}
              hover={hover}
              onHover={setHover}
            />
            <FunnelNodes
              nodes={graph.nodes}
              placements={placements}
              lastStage={props.data.stages.length - 1}
              onHover={setHover}
            />
          </svg>
        );
      }}
    </Chart>
  );
};
