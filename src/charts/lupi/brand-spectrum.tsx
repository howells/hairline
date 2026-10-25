import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { DimGroup, HitCircle, TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { KEY, TICK } from "../marks";
import { FootNote } from "../plot-note";
import { HRule, Stem } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { EngravedRect, Hatch, KeySwatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, dimClass, noteSpace, sansWidth, stagger, sum } from "../util";
import {
  brandSpectrumCompetitors,
  brandSpectrumDemo,
} from "./brand-spectrum.data";
import type { SpectrumRow } from "./brand-spectrum.data";

interface BrandSpectrumProps {
  data?: SpectrumRow[];
  /** Names for the `others` positions, in order. */
  competitors?: string[];
  /** Name for the inked position. */
  us?: string;
  height?: number;
  note?: string;
  /**
   * A position in words, for the tooltip and the accessible label. Defaults
   * to how far it leans toward a pole ("74% toward Authority"); pass this
   * when the poles are measured values and the reading is a value too.
   */
  describe?: (row: SpectrumRow, position: number) => string;
  /** The drawing's accessible title. */
  title?: string;
}

interface SpectrumHover {
  row: number;
  /** 0 = the inked hill, k + 1 = other k. */
  series: number;
  x: number;
  y: number;
}

interface SpectrumAxis {
  narrow: boolean;
  x0: number;
  x1: number;
}

interface SpectrumLayout extends SpectrumAxis {
  /** Height the rows, legend and any footnote need. */
  height: number;
  rowY: (r: number) => number;
}

/** "74% toward Authority": how far a position leans, and which way. */
const lean = (row: SpectrumRow, v: number) =>
  v >= 0.5
    ? `${Math.round(v * 100)}% toward ${row.right}`
    : `${Math.round((1 - v) * 100)}% toward ${row.left}`;

/** Stops on every rail's ruler: both ends, the centre and two between each. */
const STOPS = 7;
/** Half-height of the gap bar, so it spans 7 whole pixels on the rail. */
const GAP_HALF = 3;

/**
 * The rail's span, a whole multiple of the ruler's six intervals so every
 * tick falls on a whole pixel at one even pitch.
 */
const spectrumAxis = (width: number, data: SpectrumRow[]): SpectrumAxis => {
  const narrow = width < 520;
  const labelW = narrow ? 0 : clamp(width * 0.2, 96, 140);
  const room = narrow ? width - 28 : Math.min(width - labelW * 2 - 60, 420);
  const axisW = Math.floor(room / (STOPS - 1)) * (STOPS - 1);
  // The longer end labels pull the rail toward the shorter side, so the ink
  // of both label columns is centred, not the rail.
  const leftW = Math.max(0, ...data.map((r) => sansWidth(r.left, 11)));
  const rightW = Math.max(0, ...data.map((r) => sansWidth(r.right, 11)));
  const x0 = Math.round((width - axisW + (narrow ? 0 : leftW - rightW)) / 2);
  return { narrow, x0, x1: x0 + axisW };
};

/** The rail's ruler: seven 1px upright ticks at one even pitch. */
const Ruler = (props: { x0: number; x1: number; y: number }) => {
  const pitch = (props.x1 - props.x0) / (STOPS - 1);
  const y = Math.floor(props.y);
  return (
    <g className="fade stroke-l4">
      {Array.from({ length: STOPS }, (_, k) => {
        const major = k === 0 || k === STOPS - 1 || k * 2 === STOPS - 1;
        const len = major ? TICK.lg : TICK.md;
        // Centred on the rail's pixel row: half the length either side.
        const top = Math.floor(y + 0.5 - len / 2);
        const x = props.x0 + pitch * k;
        return <Stem key={`stop-${crisp(x)}`} x={x} y0={top} y1={top + len} />;
      })}
    </g>
  );
};

/**
 * Rows share the height left after the header, the legend (first baseline
 * 54 below the last row, 18 per extra line) and any footnote.
 */
const spectrumLayout = (
  axis: SpectrumAxis,
  height: number,
  rows: number,
  footH: number
): SpectrumLayout => {
  const top = 44 + (axis.narrow ? 14 : 0);
  const pitch = clamp((height - top - footH) / Math.max(1, rows - 1), 56, 90);
  return {
    ...axis,
    height: Math.round(top + (rows - 1) * pitch + footH),
    rowY: (r) => top + r * pitch,
  };
};

interface GapBarProps {
  fill: string;
  from: number;
  lit: boolean;
  r: number;
  to: number;
  y: number;
}

/**
 * The story of the row: a short hatched bar on the rail from the inked position to
 * the others' mean, so the gap between them is drawn, not inferred.
 */
const GapBar = ({ fill, from, lit, r, to, y }: GapBarProps) => {
  const a = Math.round(Math.min(from, to));
  const b = Math.round(Math.max(from, to));
  return (
    <g className={dimClass(!lit)}>
      <EngravedRect
        className="grow-x stroke-l5"
        fill={paint(fill)}
        height={GAP_HALF * 2 + 1}
        style={stagger(r, "series")}
        width={b - a + 1}
        x={a}
        y={Math.floor(y) - GAP_HALF}
      />
    </g>
  );
};

interface AxisRowProps {
  /** Pattern id of the gap bar's hatch. */
  gap: string;
  hover: SpectrumHover | null;
  layout: SpectrumLayout;
  onHover: (h: SpectrumHover) => void;
  r: number;
  row: SpectrumRow;
}

const AxisRow = ({ gap, hover, layout, onHover, r, row }: AxisRowProps) => {
  const { narrow, rowY, x0, x1 } = layout;
  // The rail is a 1px rule on the half pixel; every mark centres on it.
  const y = crisp(rowY(r));
  const at = (v: number) => x0 + (x1 - x0) * clamp(v, 0, 1);
  const lit = (series: number) => hover === null || hover.series === series;
  const ly = narrow ? y - 16 : y;
  const marks = [
    ...row.others.map((v, k) => ({
      id: `${row.left}-c${k}`,
      series: k + 1,
      v,
    })),
    { id: `${row.left}-us`, series: 0, v: row.us },
  ];
  return (
    <g>
      <HRule
        className="grow-x"
        kind="rule"
        style={stagger(r, "series")}
        x0={x0}
        x1={x1}
        y={rowY(r)}
      />
      <Ruler x0={x0} x1={x1} y={y} />
      <GapBar
        fill={gap}
        lit={hover === null}
        r={r}
        to={at(sum(row.others) / Math.max(1, row.others.length))}
        from={at(row.us)}
        y={y}
      />
      <Label
        anchor={narrow ? "start" : "end"}
        middle
        muted
        voice="label"
        x={narrow ? x0 : x0 - 30}
        y={ly}
      >
        {row.left}
      </Label>
      <Label
        anchor={narrow ? "end" : "start"}
        middle
        muted
        voice="label"
        x={narrow ? x1 : x1 + 30}
        y={ly}
      >
        {row.right}
      </Label>
      {marks.map((m) => {
        const us = m.series === 0;
        const cx = at(m.v);
        return (
          <DimGroup
            dim={!lit(m.series)}
            key={m.id}
            onPointerEnter={() => {
              onHover({
                row: r,
                series: m.series,
                x: cx,
                y: y - (us ? 14 : 8),
              });
            }}
          >
            <HitCircle cx={cx} cy={y} r={us ? 12 : 7} />
            {us ? (
              <Dot
                className="pop fill-hero"
                cx={cx}
                cy={y}
                size="md"
                style={stagger(r * 4, "mark")}
              />
            ) : (
              <Ring
                className="pop stroke-l5"
                cx={cx}
                cy={y}
                size="sm"
                style={stagger(r * 4 + m.series, "mark")}
              />
            )}
          </DimGroup>
        );
      })}
    </g>
  );
};

/** Room a key entry takes: swatch, gap, name, then the gap to the next. */
const entryWidth = (name: string) =>
  KEY.swatch + KEY.gap + sansWidth(name, 12) + KEY.entryGap;

/** Baseline to baseline when the key wraps. */
const KEY_LINE = 20;

/**
 * The key: the inked hill's swatch, a hollow swatch for the others and the
 * gap bar's hatch, wrapping onto a second line when the row is too narrow.
 */
const keyEntries = (gap: string, us: string, span: number) => {
  const items = [
    { name: us, tone: "fill-hero" },
    { name: "Others", tone: "fill-paper" },
    { fill: paint(gap), name: "Gap to their mean" },
  ];
  let cx = 0;
  let line = 0;
  return items.map((item) => {
    const w = entryWidth(item.name);
    if (cx > 0 && cx + w - KEY.entryGap > span) {
      cx = 0;
      line += 1;
    }
    const at = { ...item, dx: cx, line };
    cx += w;
    return at;
  });
};

const SpectrumKey = (props: {
  entries: ReturnType<typeof keyEntries>;
  x: number;
  y: number;
}) => (
  <g className="fade">
    {props.entries.map((e) => (
      <g key={e.name}>
        <KeySwatch
          fill={e.fill}
          tone={e.tone}
          x={props.x + e.dx}
          y={props.y - 9 + e.line * KEY_LINE}
        />
        <Label
          muted
          voice="label"
          x={props.x + e.dx + KEY.swatch + KEY.gap}
          y={props.y + e.line * KEY_LINE}
        >
          {e.name}
        </Label>
      </g>
    ))}
  </g>
);

/**
 * L7 Four summits. Bipolar scales where both ends are valid: one row per
 * pair of opposing poles, each rail a seven-stop ruler. One hill (ink dot)
 * and the others (hollow 1px rings, named on hover) sit along it, and a short
 * hatched bar draws the gap from the first to the others' mean.
 */
export const BrandSpectrum = (props: BrandSpectrumProps) => {
  const data = props.data ?? brandSpectrumDemo;
  const competitors = props.competitors ?? brandSpectrumCompetitors;
  const usName = props.us ?? "Ben Nevis";
  const describe = props.describe ?? lean;
  const height = props.height ?? 440;
  const [hover, setHover] = useState<SpectrumHover | null>(null);
  const gap = useTextureIds("brand")("gap");
  const seriesName = (s: number) =>
    s === 0 ? usName : (competitors.at(s - 1) ?? `Other ${s}`);
  const tipValue = (h: SpectrumHover) => {
    const row = data[h.row];
    return describe(
      row,
      h.series === 0 ? row.us : (row.others.at(h.series - 1) ?? 0.5)
    );
  };

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <TipText
              facts={[tipValue(hover)]}
              lead={seriesName(hover.series)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const axis = spectrumAxis(width, data);
        // The key starts under the rail and may run on under the right-hand labels.
        const key = keyEntries(gap, usName, width - axis.x0 - 8);
        const footH =
          54 +
          10 +
          (key.at(-1)?.line ?? 0) * KEY_LINE +
          noteSpace(props.note, width - 16, 18);
        const layout = spectrumLayout(axis, height, data.length, footH);
        const legendY = layout.rowY(data.length - 1) + 54;
        return (
          <ChartSvg
            height={layout.height}
            label={`Positions between opposing poles: ${data.map((row) => `${usName} ${describe(row, row.us)}`).join("; ")}`}
            leave={() => {
              setHover(null);
            }}
            title={
              props.title ??
              "Where one hill sits between opposing poles, against others"
            }
            width={width}
          >
            <defs>
              <Hatch id={gap} tone="fill-l4" />
            </defs>
            {data.map((row, r) => (
              <AxisRow
                gap={gap}
                hover={hover}
                key={row.left}
                layout={layout}
                onHover={setHover}
                r={r}
                row={row}
              />
            ))}
            <SpectrumKey entries={key} x={axis.x0} y={legendY} />
            <FootNote height={layout.height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
