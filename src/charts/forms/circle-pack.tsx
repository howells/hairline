import { hierarchy, pack } from "d3-hierarchy";
import type { HierarchyCircularNode } from "d3-hierarchy";
import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlateLabel, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth, stagger } from "../util";
import { orgDemo } from "./circle-pack.data";
import type { OrgNode } from "./circle-pack.data";

type Circle = HierarchyCircularNode<OrgNode>;

interface Hover {
  key: string;
  name: string;
  value: number;
  x: number;
  y: number;
}

/** A stable key from the path of names down to this circle. */
const keyOf = (n: Circle) =>
  n
    .ancestors()
    .map((a) => a.data.name)
    .join("/");

/** Outer circles lighter, inner ones darker; the hovered circle in ink. */
const strokeOf = (n: Circle, hot: boolean) => {
  if (hot) {
    return "stroke-ink";
  }
  return n.children === undefined ? "stroke-l3" : "stroke-l5";
};

/**
 * The root is open, countries carry an engraved stipple, and counties sit on
 * it as paper discs. Country fills come from the stipple pattern.
 */
const fillOf = (n: Circle) => {
  if (n.depth === 0) {
    return "fill-transparent";
  }
  return n.children === undefined ? "fill-paper" : "";
};

/** Leaf name, inside its circle, only when it fits with room to spare. */
const LeafLabel = (props: { hero: boolean; n: Circle }) => {
  const { n } = props;
  const fits = sansWidth(n.data.name, 11) + 8 < n.r * 2 && n.r > 13;
  if (!fits) {
    return null;
  }
  if (props.hero) {
    // Two hero plates, name over value, centred on the disc.
    return (
      <g className="fade pointer-events-none" style={stagger(6, "mark")}>
        <PlateLabel
          className="t-label"
          hero
          text={n.data.name}
          x={n.x}
          y={n.y - 7.5}
        />
        <PlateLabel hero text={String(n.value ?? 0)} x={n.x} y={n.y + 7.5} />
      </g>
    );
  }
  return (
    <text
      className="fade t-axis pointer-events-none"
      dy="0.34em"
      style={stagger(6, "mark")}
      textAnchor="middle"
      x={n.x}
      y={n.y}
    >
      {n.data.name}
    </text>
  );
};

const layout = (data: OrgNode, size: number) =>
  pack<OrgNode>()
    .size([size, size])
    .padding((n) => (n.depth === 0 ? 10 : 4))(
    // The data lists every level largest first, so pack keeps that order.
    hierarchy(data).sum((d) => d.value ?? 0)
  );

/**
 * O9 Towers by county. Countries as stippled hairline circles, counties as
 * paper discs on them; the county with most towers is the only ink mark.
 * Hover any circle for its count.
 */
export const CirclePack = (props: { data?: OrgNode }) => {
  const data = props.data ?? orgDemo;
  const [hover, setHover] = useState<Hover | null>(null);
  const stipple = useTextureIds("towers")("stipple");
  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{hover.name}</b> · {hover.value} towers
          </Tooltip>
        )
      }
    >
      {(width) => {
        const size = Math.min(width, 460);
        const root = layout(data, size);
        const nodes = root.descendants();
        const leaves = root.leaves();
        let [hero] = leaves;
        for (const n of leaves) {
          if ((n.value ?? 0) > (hero.value ?? 0)) {
            hero = n;
          }
        }
        const dx = Math.round((width - size) / 2);
        const label = `Towers with a ring of bells, by county, ${root.value} in all; most in ${hero.data.name}, ${hero.value}`;
        return (
          <svg
            aria-label={label}
            height={size}
            onPointerLeave={() => {
              setHover(null);
            }}
            width={width}
          >
            <title>{label}</title>
            <defs>
              <Stipple id={stipple} tone="fill-l4" />
            </defs>
            <g transform={`translate(${dx} 0)`}>
              {nodes.map((n, i) => {
                const key = keyOf(n);
                const isHero = n === hero;
                return (
                  <circle
                    className={`pop transition-colors ${isHero ? "fill-hero" : `${fillOf(n)} ${strokeOf(n, hover?.key === key)}`}`}
                    cx={n.x}
                    cy={n.y}
                    fill={n.depth === 1 ? paint(stipple) : undefined}
                    key={key}
                    onPointerEnter={() => {
                      setHover({
                        key,
                        name: n.data.name,
                        value: n.value ?? 0,
                        x: dx + n.x,
                        y: n.y - n.r - 4,
                      });
                    }}
                    r={n.r - 0.5}
                    strokeWidth={isHero ? 0 : 1}
                    style={stagger(i, "fine")}
                  />
                );
              })}
              {leaves.map((n) => (
                <LeafLabel hero={n === hero} key={`label-${keyOf(n)}`} n={n} />
              ))}
            </g>
          </svg>
        );
      }}
    </Plot>
  );
};
