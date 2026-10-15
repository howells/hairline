import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { circularGraphDemo } from "./circular-graph.data";
import type { CircleLink, CircleNode } from "./circular-graph.data";
import { LinkBundle } from "./link-bundle";
import { bundleLines } from "./util-b";

interface CircularGraphProps {
  nodes?: CircleNode[];
  links?: CircleLink[];
  height?: number;
  format?: (v: number) => string;
  /** Unit for link totals in the tooltip, e.g. "shared projects". */
  linkUnit?: string;
  note?: string;
  /** Node id to draw in the hero colour. */
  highlight?: string;
}

interface Placed {
  node: CircleNode;
  i: number;
  x: number;
  y: number;
  a: number;
  r: number;
}

const defaultFormat = (v: number) => `${v} people`;

const linkKey = (l: CircleLink) => `${l.source}→${l.target}`;
const touches = (id: string, l: CircleLink) =>
  l.source === id || l.target === id;

interface LinksProps {
  links: CircleLink[];
  at: Map<string, Placed>;
  cx: number;
  cy: number;
  focus: string | null;
  /** The hero link, in ink. */
  hero: string;
}

const linkTone = (hero: boolean, on: boolean) => {
  if (hero) {
    return "stroke-ink";
  }
  return on ? "stroke-l2" : "stroke-l4";
};

/**
 * Links bowed through the middle (control point halfway to the centre), each
 * engraved as a bundle of 1–4 hairlines by shared projects.
 */
const RingLinks = ({ links, at, cx, cy, focus, hero }: LinksProps) => {
  const maxLink = Math.max(...links.map((l) => l.value));
  return (
    <g>
      {links.map((l, k) => {
        const s = at.get(l.source);
        const t = at.get(l.target);
        if (s === undefined || t === undefined) {
          return null;
        }
        const on = focus !== null && touches(focus, l);
        return (
          <LinkBundle
            key={linkKey(l)}
            className={`draw transition-tone ${linkTone(linkKey(l) === hero, on)} ${focus !== null && !on ? "opacity-25" : ""}`}
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
  dim: boolean;
  onEnter: () => void;
}

/** Where a node's name starts (or ends, on the left half) and which side it sits. */
const labelOf = (p: Placed) => {
  const right = Math.cos(p.a) > -0.2;
  return {
    right,
    x: p.x + Math.cos(p.a) * 4 + (right ? p.r + 8 : -p.r - 8),
  };
};

const RingNode = ({ p, hero, dim, onEnter }: NodeProps) => {
  const { right, x: lx } = labelOf(p);
  return (
    <g className={dimClass(dim)} onPointerEnter={onEnter}>
      <circle cx={p.x} cy={p.y} r={p.r + 8} fill="transparent" />
      <circle
        className={`pop ${hero ? "fill-hero" : "fill-paper stroke-l3"}`}
        style={stagger(p.i, "mark")}
        cx={p.x}
        cy={p.y}
        r={hero ? p.r : p.r - 0.75}
        strokeWidth={hero ? undefined : 1.5}
      />
      <text
        className={`fade t-name ${hero ? "" : "fill-muted"}`}
        style={stagger(p.i, "mark")}
        x={lx}
        y={p.y + Math.sin(p.a) * 6}
        dy="0.35em"
        textAnchor={right ? "start" : "end"}
      >
        {p.node.id}
      </text>
    </g>
  );
};

/**
 * G6 Team links. Up to a dozen nodes on a ring, area = size, links bowed
 * through the middle, each a bundle of 1–4 hairlines by shared projects.
 * Hover a node to trace it. The biggest team is the one solid node and its
 * strongest link the one ink bundle; the rest are hollow rings and l4
 * hairlines.
 */
export const CircularGraph = (props: CircularGraphProps) => {
  const nodes = props.nodes ?? circularGraphDemo.nodes;
  const links = props.links ?? circularGraphDemo.links;
  const height = props.height ?? 460;
  const format = props.format ?? defaultFormat;
  const linkUnit = props.linkUnit ?? "shared projects";
  const [focus, setFocus] = useState<Placed | null>(null);
  const maxNode = Math.max(...nodes.map((n) => n.value));
  // The hero: the given node, else the biggest.
  const heroId =
    props.highlight ?? nodes.find((n) => n.value === maxNode)?.id ?? "";
  // The hero link: the hero team's strongest.
  const [heroLink] = links
    .filter((l) => touches(heroId, l))
    .toSorted((a, b) => b.value - a.value);
  const focusId = focus === null ? null : focus.node.id;
  const neighbours = new Set(
    links.flatMap((l) =>
      focusId !== null && touches(focusId, l) ? [l.source, l.target] : []
    )
  );
  const total = (id: string) =>
    links.filter((l) => touches(id, l)).reduce((a, l) => a + l.value, 0);
  const label = `Network of ${nodes.length} teams: ${links.map((l) => `${l.source}–${l.target} ${l.value}`).join(", ")}`;

  return (
    <Plot
      overlay={
        focus === null ? null : (
          <Tooltip x={focus.x} y={focus.y - focus.r - 4}>
            <b>{focus.node.id}</b> · {format(focus.node.value)} ·{" "}
            {total(focus.node.id)} {linkUnit}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 460;
        const noteH = noteSpace(props.note, width - 16, 16);
        const rMax = narrow ? 18 : 26;
        const R = Math.min(
          height / 2 - rMax - 12,
          width / 2 - (narrow ? 70 : 96)
        );
        // Width-bound rings (narrow screens) trim the unused height.
        const svgH = Math.min(height, Math.round(2 * (R + rMax + 12) + noteH));
        const cy = (svgH - noteH) / 2;
        const ring = (cx: number): Placed[] =>
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
        // Centre the ring with its names: the names reach further on one side.
        const reach = ring(width / 2).flatMap((p) => {
          const { right, x } = labelOf(p);
          const end = right
            ? x + sansWidth(p.node.id, 11)
            : x - sansWidth(p.node.id, 11);
          return [p.x - p.r, p.x + p.r, end];
        });
        const cx = width - (Math.min(...reach) + Math.max(...reach)) / 2;
        const placed = ring(cx);
        const at = new Map(placed.map((p) => [p.node.id, p]));

        return (
          <svg
            width={width}
            height={svgH}
            aria-label={label}
            onPointerLeave={() => {
              setFocus(null);
            }}
          >
            <title>{label}</title>
            <RingLinks
              links={links}
              at={at}
              cx={cx}
              cy={cy}
              focus={focusId}
              hero={heroLink === undefined ? "" : linkKey(heroLink)}
            />
            {placed.map((p) => (
              <RingNode
                key={p.node.id}
                p={p}
                hero={p.node.id === heroId}
                dim={
                  focusId !== null &&
                  focusId !== p.node.id &&
                  !neighbours.has(p.node.id)
                }
                onEnter={() => {
                  setFocus(p);
                }}
              />
            ))}
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
