import { hierarchy, tree } from "d3-hierarchy";
import type { HierarchyPointNode } from "d3-hierarchy";
import { linkHorizontal } from "d3-shape";
import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { dimClass, noteSpace, stagger } from "../util";
import { treeLRDemo } from "./tree-lr.data";
import type { TreeDatum } from "./tree-lr.data";
import { fillFor, strokeFor } from "./util-a";

interface TreeLRProps {
  data?: TreeDatum;
  height?: number;
  note?: string;
  /** Name of a top-level branch to draw in the hero colour. */
  highlight?: string;
}

type P = HierarchyPointNode<TreeDatum>;

interface Tip {
  node: P;
  x: number;
  y: number;
}

/** Ladder step for every branch that is not the hero. */
const REST = 4;

const pathOf = (n: P) =>
  n
    .ancestors()
    .toReversed()
    .map((a) => a.data.name)
    .join(" › ");

/** Index of the top-level branch a node sits under, -1 for the root. */
const branchOf = (n: P) => {
  const top = n.ancestors().find((a) => a.depth === 1);
  const siblings = n.ancestors().at(-1)?.children ?? [];
  return top === undefined ? -1 : siblings.indexOf(top);
};

interface NodeProps {
  n: P;
  x: number;
  y: number;
  k: number;
  tone: string;
  lit: boolean;
  hitRight: number;
  onEnter: () => void;
}

const TEXT_TONE: Record<"leaf" | "mid" | "root", string> = {
  leaf: "fill-muted",
  mid: "fill-text t-halo",
  root: "fill-ink",
};

/**
 * Where a node's name sits: leaves to the right, the root to the left, and
 * branches centred over their dot on the side away from their incoming link
 * (above when the branch sits above the root, below when beneath it), clear
 * of the links that pass them.
 */
const labelAt = (
  role: "leaf" | "mid" | "root",
  x: number,
  y: number,
  above: boolean
) => {
  if (role === "leaf") {
    return { anchor: "start", x: x + 6, y } as const;
  }
  if (role === "mid") {
    return { anchor: "middle", x, y: above ? y - 14 : y + 14 } as const;
  }
  return { anchor: "end", x: x - 10, y } as const;
};

const TreeNode = ({ n, x, y, k, tone, lit, hitRight, onEnter }: NodeProps) => {
  const leaf = n.children === undefined;
  let role: "leaf" | "mid" | "root" = "mid";
  if (n.depth === 0) {
    role = "root";
  } else if (leaf) {
    role = "leaf";
  }
  const above = n.x <= (n.ancestors().at(-1)?.x ?? n.x);
  const at = labelAt(role, x, y, above);
  return (
    <g className={dimClass(!lit)} onPointerEnter={onEnter}>
      <rect
        x={leaf ? x - 8 : x - 40}
        y={leaf || !above ? y - 10 : y - 24}
        width={leaf ? hitRight + 8 : 80}
        height={leaf ? 20 : 34}
        fill="transparent"
      />
      {leaf ? null : (
        <circle
          className={`pop ${tone}`}
          style={stagger(n.depth * 4 + k * 0.2, "series")}
          cx={x}
          cy={y}
          r={4.5}
        />
      )}
      <text
        className={`fade t-name ${TEXT_TONE[role]}`}
        style={stagger(n.depth * 4 + k * 0.2, "series")}
        x={at.x}
        y={at.y}
        dy="0.35em"
        textAnchor={at.anchor}
      >
        {n.data.name}
      </text>
    </g>
  );
};

/**
 * G7 Product tree. A two- or three-level hierarchy laid out left to right
 * with smooth 1px hairline links; leaves are bare ends, named where the
 * link stops. One branch (the highlight, else the first) is inked; the
 * others share one grey. Hover any node to trace its path back to the root.
 */
export const TreeLR = (props: TreeLRProps) => {
  const data = props.data ?? treeLRDemo;
  const height = props.height ?? 360;
  const [tip, setTip] = useState<Tip | null>(null);
  const label = `Hierarchy: ${(data.children ?? []).map((c) => `${c.name} (${(c.children ?? []).map((g) => g.name).join(", ")})`).join("; ")}`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{pathOf(tip.node)}</b>
            {tip.node.children === undefined
              ? ""
              : ` · ${tip.node.leaves().length} features`}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 460;
        const m = {
          bottom: 10 + noteSpace(props.note, width - 16, 20),
          left: narrow ? 64 : 76,
          right: narrow ? 74 : 96,
          top: 10,
        };
        const laid = tree<TreeDatum>()
          .size([height - m.top - m.bottom, width - m.left - m.right])
          .separation((a, b) => (a.parent === b.parent ? 1 : 1.9))(
          hierarchy(data)
        );
        const X = (n: P) => m.left + n.y;
        const Y = (n: P) => m.top + n.x;
        const link = linkHorizontal<{ source: P; target: P }, P>().x(X).y(Y);
        const heroName = props.highlight ?? laid.children?.[0]?.data.name;
        const hero = (n: P) => {
          const b = branchOf(n);
          return b >= 0 && laid.children?.[b].data.name === heroName;
        };
        const toneStep = (n: P) => (branchOf(n) < 0 ? 0 : REST);
        // Hovering lights the path to the root and the whole subtree below.
        // Keyed by path: the layout (and its node objects) is rebuilt each render.
        const trail = new Set(
          tip === null
            ? []
            : [...tip.node.ancestors(), ...tip.node.descendants()].map(pathOf)
        );
        const lit = (n: P) => tip === null || trail.has(pathOf(n));

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setTip(null);
            }}
          >
            <title>{label}</title>
            <g fill="none" strokeWidth={1}>
              {laid.links().map((l) => (
                <path
                  key={pathOf(l.target)}
                  className={`draw ${strokeFor(toneStep(l.target), hero(l.target))} ${dimClass(!lit(l.target))}`}
                  pathLength={1}
                  style={stagger(
                    (l.target.depth -
                      1 +
                      (l.target.parent?.children?.indexOf(l.target) ?? 0) *
                        0.15) *
                      4,
                    "series"
                  )}
                  d={link(l) ?? ""}
                />
              ))}
            </g>
            {laid.descendants().map((n, k) => (
              <TreeNode
                key={pathOf(n)}
                n={n}
                x={X(n)}
                y={Y(n)}
                k={k}
                tone={fillFor(toneStep(n), hero(n))}
                lit={lit(n)}
                hitRight={m.right}
                onEnter={() => {
                  setTip({ node: n, x: X(n), y: Y(n) - 8 });
                }}
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
