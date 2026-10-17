import { fmtSignedPct } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { TICK } from "../marks";
import { HRule, Stem, VRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { CrossHatch, DotScreen, EngravedRect, Hatch } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { clamp, sansWidth, stagger, sum } from "../util";
import { planRevenue } from "./revenue-by-plan.data";
import type { PlanRevenue } from "./revenue-by-plan.data";

/** Baseline of the 0–100% scale, and the rule the ticks hang from. */
const SCALE_Y = 10;
const RULE_Y = 24;
/** The slim engraved bar under the ticks, one texture per good. */
const BAR_Y = RULE_Y + TICK.xl + 6;
/** The dimension mark: a gap under the bar, then a 1px tick down to the label. */
const DIM_GAP = 4;
/** Baselines of the label block's three lines, from the bar's foot. */
const NAME_Y = 34;
const SHARE_Y = 51;
const MONEY_Y = 67;
/** Growth columns: width, and the room kept over the tallest for its value. */
const COL_W = 16;
const COL_TOP = 112;
const VALUE_ROOM = 20;
/** Room under the growth baseline for its note. */
const NOTE_ROOM = 22;

/** Ruler tick tones by rank: the dearest good in ink, the rest down the ramp. */
const TONES = ["stroke-ink", "stroke-l2", "stroke-l3", "stroke-l4"];

/** The 0% and 100% labels sit inside the ruler's ends. */
const scaleAnchor = (f: number) => {
  if (f === 0) {
    return "start";
  }
  return f === 1 ? "end" : "middle";
};

/**
 * Each good's texture on paper, by rank: the largest crosshatched in ink,
 * then hatches that turn and lighten, and a dot screen for the smallest.
 */
const Textures = ({ tex }: { tex: (name: string) => string }) => (
  <defs>
    <CrossHatch id={tex("0")} tone="fill-hero" />
    <Hatch angle="rising" id={tex("1")} tone="fill-l2" />
    <Hatch angle="falling" id={tex("2")} tone="fill-l3" />
    <DotScreen id={tex("3")} r={1} tone="fill-l3" />
  </defs>
);

const fmtShare = (v: number) => `${Math.round(v * 100)}%`;
/** A price in pounds and pence ("£4.77"). */
const fmtPounds = (v: number) => `£${v.toFixed(2)}`;

interface Segment extends PlanRevenue {
  end: number;
  growth: number;
  k: number;
  share: number;
  start: number;
}

const segmentsOf = (data: PlanRevenue[]): Segment[] => {
  const total = sum(data.map((d) => d.revenue));
  let start = 0;
  return data
    .toSorted((a, b) => b.revenue - a.revenue)
    .map((d, k) => {
      const share = d.revenue / total;
      const seg = {
        ...d,
        end: start + share,
        growth: d.revenue / d.prior - 1,
        k,
        share,
        start,
      };
      start += share;
      return seg;
    });
};

interface Layout {
  barH: number;
  /** The bar's foot. */
  base: number;
  /** The growth columns' baseline. */
  floor: number;
  height: number;
  x: (f: number) => number;
}

const layoutOf = (width: number): Layout => {
  const x1 = width - 1;
  const barH = clamp(Math.round(width / 16), 28, 40);
  const base = BAR_Y + barH;
  const height = clamp(Math.round(width * 0.82), 380, 470);
  return {
    barH,
    base,
    floor: height - NOTE_ROOM,
    height,
    x: (f) => f * x1,
  };
};

/** Which tick (0–100) belongs to which good: the one its first percent falls in. */
const ticksOf = (seg: Segment, last: boolean) =>
  Array.from({ length: 101 }, (_, i) => i).filter((i) => {
    const at = (Math.min(i, 99) + 0.5) / 100;
    return at >= seg.start && (last || at < seg.end);
  });

interface GrowthProps {
  fill: string;
  gMax: number;
  lay: Layout;
  left: number;
  outline: string;
  seg: Segment;
  tone: string;
  width: number;
}

/**
 * The good's rise on 2014 as a slim engraved column standing on a shared
 * baseline, hung from the good's edge by a fine plumb line.
 */
const GrowthColumn = ({
  fill,
  gMax,
  lay,
  left,
  outline,
  seg,
  tone,
  width,
}: GrowthProps) => {
  const rise = fmtSignedPct(seg.growth * 100);
  const flip = left + sansWidth(rise, 13) > width;
  const top = lay.base + COL_TOP;
  const h = Math.max(4, Math.round(((lay.floor - top) * seg.growth) / gMax));
  const y = lay.floor - h;
  return (
    <>
      <VRule
        className="grow-y from-top"
        kind="rule"
        style={stagger(seg.k + 4)}
        x={left}
        y0={lay.base + MONEY_Y + 10}
        y1={y - VALUE_ROOM}
      />
      <Label
        anchor={flip ? "end" : "start"}
        className={tone}
        order={seg.k + 6}
        voice="value"
        x={flip ? width : left}
        y={y - 7}
      >
        {rise}
      </Label>
      <EngravedRect
        className={`grow-y ${outline}`}
        fill={fill}
        height={h + 1}
        style={stagger(seg.k + 4, "series")}
        whole={
          seg.k >= 3 ? { clear: 1, pitch: TEXTURE_PITCH.screen } : undefined
        }
        width={COL_W}
        x={left}
        y={y}
      />
    </>
  );
};

interface SegmentProps {
  dim: boolean;
  /** The pattern fill for the good's stretch of the bar. */
  fill: string;
  gMax: number;
  lay: Layout;
  onEnter: () => void;
  seg: Segment;
  ticks: number[];
  width: number;
}

/**
 * One good: its run of ruler ticks, its stretch of the bar, a dimension tick
 * down to its name, share and price, and its rise on 2014.
 */
const SegmentMarks = ({
  dim,
  fill,
  gMax,
  lay,
  onEnter,
  seg,
  ticks,
  width,
}: SegmentProps) => {
  const { base, x } = lay;
  const hero = seg.k === 0;
  // Whole-pixel bar cell with a 2px paper gap after the good before it.
  const left = Math.round(x(seg.start)) + (hero ? 0 : 2);
  const tone = hero ? "" : "fill-muted";
  const outline = hero ? "stroke-ink" : "stroke-l5";
  // A narrow last segment would run its text past the plot: end it at the edge.
  const textW = Math.max(
    sansWidth(seg.plan, 13),
    sansWidth(fmtShare(seg.share), 13),
    sansWidth(fmtPounds(seg.revenue), 13)
  );
  const flip = left + textW > width;
  const textX = flip ? width : left;
  const anchor = flip ? "end" : "start";
  return (
    <DimGroup dim={dim} onPointerEnter={onEnter}>
      <HitRect
        height={lay.height}
        width={Math.max(1, x(seg.end) - x(seg.start))}
        x={x(seg.start)}
        y={0}
      />
      {ticks.map((i) => (
        <Stem
          className={`grow-y from-top ${TONES[Math.min(seg.k, 3)]}`}
          key={i}
          style={stagger(i, "dense")}
          x={x(i / 100)}
          y0={RULE_Y}
          y1={RULE_Y + (i % 10 === 0 ? TICK.xl : TICK.lg)}
        />
      ))}
      <EngravedRect
        className={`grow-x ${outline}`}
        fill={fill}
        height={lay.barH}
        style={stagger(seg.k, "series")}
        whole={
          seg.k >= 3 ? { clear: 1, pitch: TEXTURE_PITCH.screen } : undefined
        }
        width={Math.max(2, Math.round(x(seg.end)) - left)}
        x={left}
        y={BAR_Y}
      />
      <Stem
        className={`grow-y from-top ${hero ? "stroke-ink" : "stroke-l4"}`}
        style={stagger(seg.k + 2)}
        x={left}
        y0={base + DIM_GAP}
        y1={base + DIM_GAP + TICK.xl}
      />
      <g className="fade" style={stagger(seg.k + 4)}>
        <Label
          anchor={anchor}
          muted={!hero}
          voice="label"
          x={textX}
          y={base + NAME_Y}
        >
          {seg.plan}
        </Label>
        <Label
          anchor={anchor}
          muted={!hero}
          voice="value"
          x={textX}
          y={base + SHARE_Y}
        >
          {fmtShare(seg.share)}
        </Label>
        <Label anchor={anchor} muted voice="value" x={textX} y={base + MONEY_Y}>
          {fmtPounds(seg.revenue)}
        </Label>
      </g>
      <GrowthColumn
        fill={fill}
        gMax={gMax}
        lay={lay}
        left={left}
        outline={outline}
        seg={seg}
        tone={tone}
        width={width}
      />
    </DimGroup>
  );
};

/** The 0–100% ruler's labels and the rule its ticks hang from. */
const Scale = ({ x, x1 }: { x: (f: number) => number; x1: number }) => (
  <>
    {[0, 0.5, 1].map((f) => (
      <Label anchor={scaleAnchor(f)} key={f} voice="axis" x={x(f)} y={SCALE_Y}>
        {fmtShare(f)}
      </Label>
    ))}
    <HRule x0={0} x1={x1} y={RULE_Y - 1} />
  </>
);

interface RevenueByPlanProps {
  data?: PlanRevenue[];
}

/**
 * O2 Everyday prices. Four prices as one 0–100% ruler over a slim engraved
 * bar, each good called out below like a dimension on a drawing: a fine tick
 * down to its name, share and price. Under that, each price's rise on ten
 * years earlier. The dearest good is crosshatched in ink.
 */
export const RevenueByPlan = (props: RevenueByPlanProps) => {
  const segments = segmentsOf(props.data ?? planRevenue);
  const hover = useHover<number>();
  const tex = useTextureIds("revenue-by-plan");
  const gMax = Math.max(...segments.map((s) => s.growth));
  const label = segments
    .map(
      (s) =>
        `${s.plan} ${fmtShare(s.share)}, ${fmtSignedPct(s.growth * 100)} on 2014`
    )
    .join("; ");
  const title = `Average shop prices in 2024 as shares of the four, with the rise on 2014: ${label}`;

  return (
    <Plot>
      {(width) => {
        const lay = layoutOf(width);
        const tipSeg = hover.key === null ? null : segments[hover.key];
        return (
          <>
            <ChartSvg
              height={lay.height}
              label={title}
              leave={hover.clear}
              width={width}
            >
              <Textures tex={tex} />
              <Scale x={lay.x} x1={width - 1} />
              <HRule x0={0} x1={width - 1} y={lay.floor} />
              <Label anchor="end" voice="axis" x={width} y={lay.floor + 16}>
                Rise on 2014
              </Label>
              {segments.map((seg) => (
                <SegmentMarks
                  dim={hover.dim(seg.k)}
                  fill={paint(tex(String(Math.min(seg.k, 3))))}
                  gMax={gMax}
                  key={seg.plan}
                  lay={lay}
                  onEnter={hover.enter(seg.k)}
                  seg={seg}
                  ticks={ticksOf(seg, seg.k === segments.length - 1)}
                  width={width}
                />
              ))}
            </ChartSvg>
            {tipSeg === null ? null : (
              <Tooltip
                x={lay.x((tipSeg.start + tipSeg.end) / 2)}
                y={RULE_Y - 2}
              >
                <TipText
                  facts={[
                    fmtPounds(tipSeg.revenue),
                    `${(tipSeg.share * 100).toFixed(1)}%`,
                    `${fmtSignedPct(tipSeg.growth * 100)} on 2014`,
                  ]}
                  lead={tipSeg.plan}
                />
              </Tooltip>
            )}
          </>
        );
      }}
    </Plot>
  );
};
