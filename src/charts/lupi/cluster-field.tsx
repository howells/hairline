import { useState } from "react";

import { fmtInt } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { clamp, dimClass, noteSpace, sansWidth, stagger, sum } from "../util";
import { clusterFieldDemo } from "./cluster-field.data";
import type {
  ClusterDatum,
  ClusterField as ClusterFieldData,
} from "./cluster-field.data";

interface ClusterFieldProps {
  data?: ClusterFieldData;
  /** Noun for one member, e.g. "engineer". */
  noun?: string;
  /** Noun for a member's size, e.g. "commits". */
  sizeNoun?: string;
  /** Defaults to a height that fits the poster at the measured width. */
  height?: number;
  note?: string;
}

interface PlacedCluster {
  cluster: ClusterDatum;
  core: boolean;
  R: number;
  x: number;
  y: number;
}

interface FieldLayout {
  height: number;
  placed: PlacedCluster[];
  /** Dot scale, so small screens get smaller members. */
  s: number;
}

/** Hub radius in frame units: the core is fixed, islands grow with members. */
const frameR = (cluster: ClusterDatum, core: boolean) =>
  core ? 150 : 14 + 7 * Math.sqrt(cluster.members.length);

/** Room below the lowest hub for its label. */
const LABEL_ROOM = 34;

/**
 * The hubs at their frame positions, the frame cropped to the hubs (labels
 * included) and scaled to the width.
 */
const fieldLayout = (
  width: number,
  clusters: ClusterDatum[],
  coreId: string
): FieldLayout => {
  const hubs = clusters.map((cluster, k) => {
    const core = cluster.id === coreId;
    const [fx, fy] = cluster.at ?? [k * 120, 0];
    return { cluster, core, fx, fy, r: frameR(cluster, core) };
  });
  // Labels are wider than small islands, and don't scale with the frame: each
  // hub reaches its island's radius (plus a dot) or half its label, and the
  // scale is the one at which the widest reach fills the width.
  const half = hubs.map(
    (h) => sansWidth(`${h.cluster.label} · ${h.cluster.members.length}`, 11) / 2
  );
  const reachAt = (s: number) => {
    const ends = hubs.map((h, k) => Math.max(h.r * s + 4, half[k]));
    return {
      hi: Math.max(...hubs.map((h, k) => h.fx * s + ends[k])),
      lo: Math.min(...hubs.map((h, k) => h.fx * s - ends[k])),
    };
  };
  let [sLo, sHi] = [0.01, 8];
  for (let i = 0; i < 40; i += 1) {
    const mid = (sLo + sHi) / 2;
    const span = reachAt(mid);
    if (span.hi - span.lo > width) {
      sHi = mid;
    } else {
      sLo = mid;
    }
  }
  const s = sLo;
  const { lo } = reachAt(s);
  const y0 = Math.min(...hubs.map((h) => h.fy - h.r));
  const y1 = Math.max(...hubs.map((h) => h.fy + h.r));
  const placed = hubs.map((h) => ({
    R: h.r * s,
    cluster: h.cluster,
    core: h.core,
    x: h.fx * s - lo,
    y: (h.fy - y0) * s + 4,
  }));
  return { height: Math.round((y1 - y0) * s + 4 + LABEL_ROOM), placed, s };
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * The step through n even angular slots nearest the golden fraction, so
 * consecutive members land far apart and every slot is used exactly once.
 */
const goldenStep = (n: number) => {
  const target = Math.round(n * (1 - 2 / (1 + Math.sqrt(5))));
  const candidates = Array.from({ length: n }, (_, k) => k + 1).filter(
    (k) => gcd(k, n) === 1
  );
  return (
    candidates.toSorted(
      (a, b) => Math.abs(a - target) - Math.abs(b - target)
    )[0] ?? 1
  );
};

/**
 * Member positions, a sunflower on an exact angular grid: n spokes at an
 * even 360/n pitch, visited in golden order, each reaching out by the square
 * root of its turn so the field fills evenly. No jitter.
 */
const members = (p: PlacedCluster) => {
  const n = p.cluster.members.length;
  const step = goldenStep(n);
  const inner = p.core ? 0.28 : 0.38;
  return p.cluster.members.map((size, k) => {
    const a = (((k * step) % n) / n) * 2 * Math.PI;
    const d = p.R * (inner + (1 - inner) * Math.sqrt((k + 0.5) / n));
    return {
      id: `${p.cluster.id}-${k}`,
      k,
      size,
      x: p.x + Math.sin(a) * d,
      y: p.y - Math.cos(a) * d,
    };
  });
};

interface ClusterProps {
  dim: boolean;
  /** The largest member's size anywhere: the biggest dot. */
  maxSize: number;
  onEnter: () => void;
  p: PlacedCluster;
  s: number;
}

const Cluster = (props: ClusterProps) => {
  const { p } = props;
  const dotScale = clamp(props.s + 0.25, 0.7, 1.2);
  return (
    <g className={dimClass(props.dim)} onPointerEnter={props.onEnter}>
      <circle cx={p.x} cy={p.y} fill="transparent" r={p.R} />
      {members(p).map((m) => (
        <g key={m.id}>
          <line
            className="draw stroke-l6"
            pathLength={1}
            strokeWidth={1}
            style={stagger(m.k, "dense")}
            x1={p.x}
            x2={m.x}
            y1={p.y}
            y2={m.y}
          />
          <circle
            className={`pop ${p.core ? "fill-l3" : "fill-l4"}`}
            cx={m.x}
            cy={m.y}
            r={(0.9 + 2.25 * Math.sqrt(m.size / props.maxSize)) * dotScale}
            style={stagger(m.k, "dense")}
          />
        </g>
      ))}
      {p.core ? (
        <circle className="pop fill-hero" cx={p.x} cy={p.y} r={6} />
      ) : (
        <circle
          className="pop fill-paper stroke-l2"
          cx={p.x}
          cy={p.y}
          r={3}
          strokeWidth={1.5}
        />
      )}
      <text
        className={`fade t-label ${p.core ? "" : "fill-muted"}`}
        textAnchor="middle"
        x={p.x}
        y={p.y + p.R + 22}
      >
        {p.cluster.label} · {p.cluster.members.length}
      </text>
    </g>
  );
};

/** Pale arcs between hubs: cross-contribution, drawn under everything. */
const Paths = (props: {
  links: [string, string][];
  placed: PlacedCluster[];
}) => {
  const byId = new Map(props.placed.map((p) => [p.cluster.id, p]));
  return (
    <g className="fade">
      {props.links.map(([from, to]) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (a === undefined || b === undefined) {
          return null;
        }
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const cx = mx - (b.y - a.y) * 0.12;
        const cy = my + (b.x - a.x) * 0.12;
        return (
          <path
            className="stroke-l6"
            d={`M${a.x},${a.y}Q${cx},${cy} ${b.x},${b.y}`}
            fill="none"
            key={`${from}-${to}`}
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
};

/**
 * L6 Contributor clusters. A core-plus-satellites network: a big core
 * cluster with radial spokes, satellite islands around hollow hubs, and pale
 * arcs between them. Spokes sit at an even angular pitch around each hub.
 * Hovering a cluster names it, with its members and their total size.
 */
export const ClusterField = (props: ClusterFieldProps) => {
  const data = props.data ?? clusterFieldDemo;
  const core = data.clusters
    .toSorted((a, b) => b.members.length - a.members.length)
    .at(0);
  const coreId = core === undefined ? "" : core.id;
  const noun = props.noun ?? "engineer";
  const sizeNoun = props.sizeNoun ?? "commits";
  const maxSize = Math.max(1, ...data.clusters.flatMap((c) => c.members));
  const [tip, setTip] = useState<{
    cluster: ClusterDatum;
    x: number;
    y: number;
  } | null>(null);

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{tip.cluster.label}</b> · {tip.cluster.members.length} {noun}s ·{" "}
            {fmtInt(sum(tip.cluster.members))} {sizeNoun}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const layout = fieldLayout(width, data.clusters, coreId);
        const height =
          props.height ?? layout.height + noteSpace(props.note, width - 16, 24);
        return (
          <svg
            aria-label={`Cluster field: ${data.clusters.map((c) => `${c.label} ${c.members.length}`).join(", ")}`}
            height={height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>A core cluster with satellite islands</title>
            <Paths links={data.links} placed={layout.placed} />
            {layout.placed.map((p) => (
              <Cluster
                dim={tip !== null && tip.cluster.id !== p.cluster.id}
                key={p.cluster.id}
                maxSize={maxSize}
                onEnter={() => {
                  setTip({ cluster: p.cluster, x: p.x, y: p.y - p.R - 4 });
                }}
                p={p}
                s={layout.s}
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
