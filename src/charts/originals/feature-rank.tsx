import { useState } from "react";
import type { PointerEvent } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, dimClass, ranks, sansWidth, stagger } from "../util";
import { featureUse, QUARTERS } from "./feature-rank.data";
import type { FeatureUse } from "./feature-rank.data";

const TOP = 40;
/** One rank per row: a 44px-plus touch row. */
const ROW = 64;
const LEFT = 20;
const GAP = 12;
/** Half a tread, as a share of its quarter's column. */
const TREAD = 0.3;
/** The thickest band, for the most weekly users, in whole px (even). */
const BAND_MAX = 22;

const fmtUsers = (v: number) => `${v}k`;
const ORDINAL = ["1st", "2nd", "3rd"];
const fmtRank = (r: number) => ORDINAL.at(r) ?? `${r + 1}th`;

interface Hover {
  f: number;
  q: number;
}

interface Layout {
  cx: (q: number) => number;
  half: number;
  /** Half a band's thickness for a weekly-users value: whole px. */
  thick: (v: number) => number;
  x0: number;
  x1: number;
  y: (r: number) => number;
}

const layoutOf = (data: FeatureUse[], width: number): Layout => {
  const nameW = Math.max(...data.map((d) => sansWidth(d.feature, 12)));
  const valueW = Math.max(
    ...data.map((d) => sansWidth(fmtUsers(d.weekly.at(-1) ?? 0), 12))
  );
  const vMax = Math.max(...data.flatMap((d) => d.weekly));
  const x0 = LEFT;
  const x1 = width - (GAP + nameW + GAP + valueW);
  const col = (x1 - x0) / QUARTERS.length;
  return {
    cx: (q) => x0 + (q + 0.5) * col,
    half: col * TREAD,
    thick: (v) => Math.max(2, Math.round(((BAND_MAX / 2) * v) / vMax)),
    x0,
    x1,
    y: (r) => Math.round(TOP + r * ROW),
  };
};

/** The tread ends: each quarter holds its row from `a` to `b`. */
const treads = (rank: number[], lay: Layout) =>
  rank.map((r, q) => ({
    a: Math.round(lay.cx(q) - lay.half),
    b:
      q === rank.length - 1
        ? Math.round(lay.x1)
        : Math.round(lay.cx(q) + lay.half),
    y: lay.y(r),
  }));

/**
 * One edge of a band, left to right: `side` -1 for the top, 1 for the bottom.
 * Edges sit half a pixel in, so the 1px outline is crisp on the treads. Where
 * a feature holds its row, its thickness steps at the quarter's bar line; where
 * it changes rows, the edge runs straight to the next tread.
 */
const bandEdge = (
  rank: number[],
  weekly: number[],
  lay: Layout,
  side: number
) => {
  const ts = treads(rank, lay).map((t, q) => ({
    ...t,
    e: t.y + side * (lay.thick(weekly[q]) - 0.5),
  }));
  return ts.flatMap((t, q) => {
    const next = ts.at(q + 1);
    const tread = [`${t.a},${t.e}`, `${t.b},${t.e}`];
    if (next === undefined || next.y !== t.y || next.e === t.e) {
      return tread;
    }
    const mid = Math.round((t.b + next.a) / 2);
    return [...tread, `${mid},${t.e}`, `${mid},${next.e}`];
  });
};

/** The band: the track as a ribbon whose thickness follows weekly users. */
const bandPath = (rank: number[], weekly: number[], lay: Layout) => {
  const top = bandEdge(rank, weekly, lay, -1);
  const bottom = bandEdge(rank, weekly, lay, 1).toReversed();
  return `M${[...top, ...bottom].join(" L")}Z`;
};

interface TrackProps {
  datum: FeatureUse;
  dim: boolean;
  hero: boolean;
  i: number;
  lay: Layout;
  rank: number[];
  tex: (name: string) => string;
  width: number;
}

/**
 * One feature: its band across the year, engraved on paper so it covers the
 * bands it crosses, and its name and Q4 value at the end.
 */
const Track = ({ datum, dim, hero, i, lay, rank, tex, width }: TrackProps) => {
  const last = rank.at(-1) ?? 0;
  const y = lay.y(last);
  const tone = hero ? "" : "fill-muted";
  return (
    <g className={dimClass(dim)}>
      <path
        className={`grow-x ${hero ? "stroke-ink" : "stroke-l5"}`}
        d={bandPath(rank, datum.weekly, lay)}
        fill={paint(tex(hero ? "hero" : "band"))}
        strokeLinejoin="miter"
        strokeWidth={1}
        style={stagger(i, "series")}
      />
      <text
        className={`fade t-label ${tone}`}
        dy="0.34em"
        style={stagger(i + 8)}
        x={lay.x1 + GAP}
        y={y}
      >
        {datum.feature}
      </text>
      <text
        className={`fade t-value ${tone}`}
        dy="0.34em"
        style={stagger(i + 8)}
        textAnchor="end"
        x={width}
        y={y}
      >
        {fmtUsers(datum.weekly.at(-1) ?? 0)}
      </text>
    </g>
  );
};

/**
 * The staff: one solid hairline per rank, a bar line between quarters, rank
 * numbers at the left and quarters on top.
 */
const Staff = ({ count, lay }: { count: number; lay: Layout }) => (
  <g>
    {QUARTERS.slice(1).map((q, k) => {
      const bx = crisp((lay.cx(k) + lay.cx(k + 1)) / 2);
      return (
        <line
          className="grid-line"
          key={q}
          x1={bx}
          x2={bx}
          y1={lay.y(0) - 14}
          y2={lay.y(count - 1) + 14}
        />
      );
    })}
    {QUARTERS.map((q, k) => (
      <text className="t-axis" key={q} textAnchor="middle" x={lay.cx(k)} y={14}>
        {q}
      </text>
    ))}
    {Array.from({ length: count }, (_, r) => (
      <g key={`rank-${r + 1}`}>
        <line
          className="grid-line"
          x1={Math.round(lay.x0)}
          x2={lay.x1}
          y1={crisp(lay.y(r))}
          y2={crisp(lay.y(r))}
        />
        <text className="t-axis" dy="0.34em" x={0} y={lay.y(r)}>
          {r + 1}
        </text>
      </g>
    ))}
  </g>
);

interface FeatureRankProps {
  data?: FeatureUse[];
}

/**
 * O3 Feature rank. Features ranked by weekly users each quarter, set like a
 * staff: each feature holds its rank on a rule for the quarter, then
 * switches rows in the gap before the next. Each track is an engraved band
 * as thick as its weekly users: fine hatch, and this year's leader
 * crosshatched in ink, thickening as it climbs.
 */
export const FeatureRank = (props: FeatureRankProps) => {
  const data = props.data ?? featureUse;
  const [hover, setHover] = useState<Hover | null>(null);
  const tex = useTextureIds("feature-rank");
  const byQuarter = QUARTERS.map((_, q) => ranks(data.map((d) => d.weekly[q])));
  const rankOf = data.map((_, f) => byQuarter.map((r) => r[f]));
  const hero = rankOf.findIndex((r) => r.at(-1) === 0);
  const height = TOP + (data.length - 1) * ROW + 20;
  // The hero draws last, over the tracks it crosses.
  const order = [...[...data.keys()].filter((f) => f !== hero), hero];
  const label = `Feature rank by weekly users, ${QUARTERS[0]} to ${QUARTERS.at(-1) ?? ""}: ${data[hero].feature} leads with ${fmtUsers(data[hero].weekly.at(-1) ?? 0)}`;

  return (
    <Plot>
      {(width) => {
        const lay = layoutOf(data, width);
        const col = (lay.x1 - lay.x0) / QUARTERS.length;
        const onMove = (e: PointerEvent<SVGSVGElement>) => {
          const box = e.currentTarget.getBoundingClientRect();
          const q = clamp(
            Math.floor((e.clientX - box.left - lay.x0) / col),
            0,
            QUARTERS.length - 1
          );
          const r = clamp(
            Math.round((e.clientY - box.top - TOP) / ROW),
            0,
            data.length - 1
          );
          setHover({ f: byQuarter[q].indexOf(r), q });
        };
        return (
          <>
            <svg
              aria-label={label}
              className="touch-pan-y"
              height={height}
              onPointerLeave={() => {
                setHover(null);
              }}
              onPointerMove={onMove}
              width={width}
            >
              <title>{label}</title>
              <defs>
                <Hatch ground="fill-paper" id={tex("band")} tone="fill-l4" />
                <CrossHatch
                  ground="fill-paper"
                  id={tex("hero")}
                  tone="fill-ink"
                />
              </defs>
              <Staff count={data.length} lay={lay} />
              {order.map((f) => (
                <Track
                  datum={data[f]}
                  dim={hover !== null && hover.f !== f}
                  hero={f === hero}
                  i={f}
                  key={data[f].feature}
                  lay={lay}
                  rank={rankOf[f]}
                  tex={tex}
                  width={width}
                />
              ))}
            </svg>
            {hover === null ? null : (
              <Tooltip
                x={lay.cx(hover.q)}
                y={lay.y(rankOf[hover.f][hover.q]) - 6}
              >
                <b>{data[hover.f].feature}</b> · {QUARTERS[hover.q]} ·{" "}
                {fmtRank(rankOf[hover.f][hover.q])} ·{" "}
                {fmtUsers(data[hover.f].weekly[hover.q])}
              </Tooltip>
            )}
          </>
        );
      }}
    </Plot>
  );
};
