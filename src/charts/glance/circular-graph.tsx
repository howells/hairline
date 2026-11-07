import type { NoteProps } from "../../schema/options";
import { Plot, Tooltip } from "../core";
import { TipText } from "../hover";
import { NetworkLive, NodeCaption } from "../network";
import { FOCUS_RING, useNodeSelection } from "../network-select";
import {
  STEP_STROKE,
  adjacencyOf,
  linkStepOf,
  pickNode,
  reachText,
  stepFade,
  stepOf,
  stepsFrom,
} from "../network-steps";
import type { Step } from "../network-steps";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { noteSpace, sansWidth, stagger, noteOf } from "../util";
import { circularGraphDemo } from "./circular-graph.data";
import type { CircleLink, CircleNode } from "./circular-graph.data";
import { LinkBundle } from "./link-bundle";
import { bundleLines } from "./util-b";

interface CircularGraphProps extends NoteProps {
  nodes?: CircleNode[];
  links?: CircleLink[];
  height?: number;
  format?: (v: number) => string;
  /** Node id to draw in the hero colour. */
  highlight?: string;
  /** Node id selected until the pointer or keys choose another; its links fade out from it. */
  selected?: string;
}

interface Placed {
  node: CircleNode;
  i: number;
  x: number;
  y: number;
  a: number;
  r: number;
}

const defaultFormat = (v: number) => `${v}k moves`;

const linkKey = (l: CircleLink) => `${l.source}→${l.target}`;

const touches = (id: string, l: CircleLink) =>
  l.source === id || l.target === id;

/** The region a node swaps the most people with, among the links drawn. */
const partnerOf = (links: CircleLink[], id: string) => {
  const [best] = links
    .filter((l) => touches(id, l))
    .toSorted((a, b) => b.value - a.value);

  if (best === undefined) {
    return "";
  }

  return best.source === id ? best.target : best.source;
};

interface LinksProps {
  links: CircleLink[];
  at: Map<string, Placed>;
  cx: number;
  cy: number;
  /** Steps out from the selected node; null when none is selected. */
  steps: ReadonlyMap<string, Step> | null;
  /** The hero link, in ink. */
  hero: string;
}

/** At rest the hero link is ink and the rest l4; selected, every link is toned by its steps. */
const linkTone = (steps: LinksProps["steps"], hero: boolean, l: CircleLink) => {
  if (steps !== null) {
    const step = linkStepOf(steps, l.source, l.target);

    return `${STEP_STROKE[step]} ${stepFade(step)}`;
  }

  return `transition-opacity ${hero ? "stroke-ink" : "stroke-l4"}`;
};

/**
 * Links bowed through the middle (control point halfway to the centre), each
 * engraved as a bundle of 1–4 hairlines by shared projects.
 */
const RingLinks = ({ links, at, cx, cy, steps, hero }: LinksProps) => {
  const maxLink = Math.max(...links.map((l) => l.value));

  return (
    <g>
      {links.map((l, k) => {
        const s = at.get(l.source);
        const t = at.get(l.target);

        if (s === undefined || t === undefined) {
          return null;
        }

        return (
          <LinkBundle
            key={linkKey(l)}
            className={`draw transition-tone ${linkTone(steps, linkKey(l) === hero, l)}`}
            lines={bundleLines(l.value, maxLink)}
            q={{ x: ((s.x + t.x) / 2 + cx) / 2, y: ((s.y + t.y) / 2 + cy) / 2 }}
            s={s}
            style={stagger(k, "mark")}
            t={t}
          />
        );
      })}
    </g>
  );
};

interface NodeProps {
  p: Placed;
  /** The one solid node; every other node is a hollow ring. */
  hero: boolean;
  /** Steps from the selected node; null when none is selected. */
  step: Step | null;
}

/** A node's look: at rest the hero is solid; selected, the node is solid and its steps tone the rings. */
const nodeLook = (hero: boolean, step: Step | null) => {
  if (step === null) {
    return hero ? "fill-hero" : "fill-paper stroke-l3";
  }

  return step === 0 ? "fill-hero" : `fill-paper ${STEP_STROKE[step]}`;
};

/** Where a node's name starts (or ends, on the left half) and which side it sits. */
const labelOf = (p: Placed) => {
  const right = Math.cos(p.a) > -0.2;

  return {
    right,
    x: p.x + Math.cos(p.a) * 4 + (right ? p.r + 8 : -p.r - 8),
  };
};

const RingNode = ({ p, hero, step }: NodeProps) => {
  const { right, x: lx } = labelOf(p);
  const solid = step === null ? hero : step === 0;

  return (
    <g className={step === null ? undefined : stepFade(step)}>
      <circle
        className={`pop ${nodeLook(hero, step)}`}
        style={stagger(p.i, "mark")}
        cx={p.x}
        cy={p.y}
        r={solid ? p.r : p.r - 0.75}
        strokeWidth={solid ? undefined : 1.5}
      />
      <Label
        anchor={right ? "start" : "end"}
        className={step === 0 ? "opacity-0" : undefined}
        dy="0.35em"
        muted={!hero}
        order={p.i}
        tier="mark"
        voice="label"
        x={lx}
        y={p.y + Math.sin(p.a) * 6}
      >
        {p.node.id}
      </Label>
    </g>
  );
};

interface ReadoutProps {
  /** The node to read out: the tooltip waits until the pointer or keys choose one. */
  focus: Placed | undefined;
  format: (v: number) => string;
  links: CircleLink[];
  steps: ReadonlyMap<string, Step> | null;
}

/** The tooltip over the chosen node, and the selection said aloud. */
const RingReadout = ({ focus, format, links, steps }: ReadoutProps) => (
  <>
    {focus === undefined ? null : (
      <Tooltip x={focus.x} y={focus.y - focus.r - 4}>
        <TipText
          facts={[
            format(focus.node.value),
            `most with ${partnerOf(links, focus.node.id)}`,
          ]}
          lead={focus.node.id}
        />
      </Tooltip>
    )}
    <NetworkLive
      text={
        focus === undefined || steps === null
          ? ""
          : `${focus.node.id}: ${reachText(steps)}`
      }
    />
  </>
);

/**
 * G6 Moving between regions. Up to a dozen nodes on a ring, area = size,
 * links bowed through the middle, each a bundle of 1–4 hairlines by the moves
 * between the pair. The biggest region is the one solid node and its strongest
 * link the one ink bundle; the rest are hollow rings and l4 hairlines. Hover,
 * tap or arrow to a node and everything fades out from it by links: it and its
 * direct links in ink, two steps in a mid tone, the rest near the paper, with
 * its name and reach beside it.
 */
export const CircularGraph = (props: CircularGraphProps) => {
  const nodes = props.nodes ?? circularGraphDemo.nodes;
  const links = props.links ?? circularGraphDemo.links;
  const height = props.height ?? 460;
  const format = props.format ?? defaultFormat;
  const sel = useNodeSelection(props.selected);
  const maxNode = Math.max(...nodes.map((n) => n.value));

  // The hero: the given node, else the biggest.
  const heroId =
    props.highlight ?? nodes.find((n) => n.value === maxNode)?.id ?? "";

  // The hero link: the hero team's strongest.
  const [heroLink] = links
    .filter((l) => touches(heroId, l))
    .toSorted((a, b) => b.value - a.value);

  const ids = nodes.map((n) => n.id);

  const steps =
    sel.selected === null
      ? null
      : stepsFrom(adjacencyOf(ids, links), sel.selected);

  const label = `Moves between ${nodes.length} regions: ${links.map((l) => `${l.source}–${l.target} ${format(l.value)}`).join(", ")}`;

  return (
    <Plot>
      {(width) => {
        const narrow = width < 460;
        const noteH = noteSpace(noteOf(props), width - 16, 16);
        const rMax = narrow ? 18 : 26;

        const R0 = Math.min(
          height / 2 - rMax - 12,
          width / 2 - (narrow ? 70 : 96)
        );

        const ring = (cx: number, R: number, cy: number): Placed[] =>
          nodes.map((node, i) => {
            const a =
              -Math.PI / 2 +
              (i / nodes.length) * Math.PI * 2 -
              Math.PI / nodes.length;

            return {
              a,
              i,
              node,
              r: Math.max(3, rMax * Math.sqrt(node.value / maxNode)),
              x: cx + R * Math.cos(a),
              y: cy + R * Math.sin(a),
            };
          });

        // How far the ring and its names reach either side of the centre.
        const reachOf = (R: number) =>
          ring(width / 2, R, 0).flatMap((p) => {
            const { right, x } = labelOf(p);

            const end = right
              ? x + sansWidth(p.node.id, 11)
              : x - sansWidth(p.node.id, 11);

            return [p.x - p.r, p.x + p.r, end];
          });

        // Long names shrink the ring until the whole composition fits the plot.
        const span0 = Math.max(...reachOf(R0)) - Math.min(...reachOf(R0));
        const R = Math.max(40, R0 - Math.max(0, span0 - (width - 8)) / 2);
        // Width-bound rings (narrow screens) trim the unused height.
        const svgH = Math.min(height, Math.round(2 * (R + rMax + 12) + noteH));
        const cy = (svgH - noteH) / 2;
        // Centre the ring with its names: the names reach further on one side.
        const reach = reachOf(R);
        const cx = width - (Math.min(...reach) + Math.max(...reach)) / 2;
        const placed = ring(cx, R, cy);
        const at = new Map(placed.map((p) => [p.node.id, p]));

        const bound = sel.bind({
          find: (x, y, within) =>
            placed[pickNode(placed, x, y, within)]?.node.id ?? null,
          height: svgH,
          ids,
          width,
        });

        const focus = sel.selected === null ? undefined : at.get(sel.selected);

        return (
          <div className="relative">
            <ChartSvg
              className={`touch-pan-y ${FOCUS_RING}`}
              desc="Arrow keys step through the regions; Escape clears."
              height={svgH}
              label={label}
              leave={bound.leave}
              width={width}
              {...bound.svg}
            >
              <RingLinks
                links={links}
                at={at}
                cx={cx}
                cy={cy}
                steps={steps}
                hero={heroLink === undefined ? "" : linkKey(heroLink)}
              />
              {placed.map((p) => (
                <RingNode
                  key={p.node.id}
                  p={p}
                  hero={p.node.id === heroId}
                  step={steps === null ? null : stepOf(steps, p.node.id)}
                />
              ))}
              {focus === undefined || steps === null ? null : (
                <NodeCaption
                  name={focus.node.id}
                  note={reachText(steps)}
                  r={focus.r}
                  width={width}
                  x={focus.x}
                  y={focus.y}
                />
              )}
              <FootNote height={svgH} text={noteOf(props)} width={width} />
            </ChartSvg>
            <RingReadout
              focus={sel.chosen ? focus : undefined}
              format={format}
              links={links}
              steps={steps}
            />
          </div>
        );
      }}
    </Plot>
  );
};
