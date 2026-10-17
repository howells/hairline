import { scaleBand } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { stagger } from "../util";
import { rungBarsDemo } from "./rung-bars.data";
import type { RungDatum } from "./rung-bars.data";
import { rungPitch, rungY } from "./rung-geometry";
import { Rungs } from "./rungs";
import { maxIndex } from "./util-b";

interface RungBarsProps {
  data?: RungDatum[];
  format?: (v: number) => string;
  height?: number;
  /** Index of the bar to emphasise in the hero colour. Defaults to the largest. */
  highlight?: number;
  /** Footnote under the axis, e.g. "One rung = 100 rings". */
  note?: string;
  /** Units per rung. */
  unit?: number;
}

/** How far each column's engraved shadow falls, right and down, in px. */
const SHADOW = 10;
/** The long, dark rung: every tenth, reaching this far past the column. */
const TENS = 10;
const TENS_REACH = 3;

interface Ladder {
  bandwidth: number;
  datum: RungDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  hero: boolean;
  index: number;
  left: number;
  pitch: number;
  rungs: number;
  /** Pattern id for a named engraving. */
  tex: (name: string) => string;
  onEnter: () => void;
}

/**
 * The column's cast shadow, the way shaded engraved type is cut: a band of
 * hatch on paper along the column's right side, meeting its top corner at 45°
 * and standing on the floor. Light falls from the upper left.
 */
const CastShadow = (props: {
  floor: number;
  hero: boolean;
  index: number;
  right: number;
  tex: (name: string) => string;
  top: number;
}) => {
  const { floor, right, top } = props;
  const points = [
    [right, top],
    [right + SHADOW, top + SHADOW],
    [right + SHADOW, floor],
    [right, floor],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <polygon
      className="fade shape-crisp"
      fill={paint(props.tex(props.hero ? "shade-hero" : "shade"))}
      points={points}
      style={stagger(props.index)}
    />
  );
};

/**
 * One bar: a carved column of 2px rungs, one per unit, every tenth long and
 * dark, with its engraved shadow behind and its value on top.
 */
const LadderBar = (props: Ladder) => {
  const top = rungY(props.floor, props.rungs - 1, props.pitch);
  const centre = props.left + props.bandwidth / 2;
  const right = Math.round(props.left + props.bandwidth);
  return (
    <DimGroup dim={props.dim} onPointerEnter={props.onEnter}>
      <HitRect
        height={props.floor - top + 24}
        width={props.bandwidth + 12 + SHADOW}
        x={props.left - 6}
        y={top - 24}
      />
      <CastShadow
        floor={props.floor}
        hero={props.hero}
        index={props.index}
        right={right}
        tex={props.tex}
        top={top}
      />
      <Rungs
        accent={props.hero ? "fill-hero" : "fill-l2"}
        className={props.hero ? "fill-hero" : "fill-l4"}
        every={TENS}
        reach={TENS_REACH}
        floor={props.floor}
        id={props.datum.label}
        left={props.left}
        n={props.rungs}
        order={props.index * 2}
        pitch={props.pitch}
        width={props.bandwidth}
      />
      <Label
        anchor="middle"
        order={props.index}
        voice="value"
        x={centre}
        y={top - 10}
      >
        {props.format(props.datum.value)}
      </Label>
      <Label
        anchor="middle"
        muted
        voice="label"
        x={centre}
        y={props.floor + 18}
      >
        {props.datum.label}
      </Label>
    </DimGroup>
  );
};

/**
 * F1 Counted bars. Each bar is a carved column of solid 2px rungs at one
 * pitch, one per unit, every tenth long and dark like the marks on a rule,
 * casting an engraved hatch shadow behind and to its right. The largest bar
 * is in ink and its shadow is crosshatched.
 */
export const RungBars = (props: RungBarsProps) => {
  const data = props.data ?? rungBarsDemo;
  const unit = props.unit ?? 1;
  const height = props.height ?? 460;
  const format = props.format ?? String;
  const hover = useHover<number>();
  const tex = useTextureIds("counted");

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[format(data[hover.at.key].value)]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const margin = {
          bottom: props.note === undefined ? 30 : 50,
          left: 16,
          right: 16,
          top: 28,
        };
        const plotWidth = Math.min(
          width - margin.left - margin.right,
          data.length * 120
        );
        const x0 = (width - plotWidth) / 2;
        const x = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([x0, x0 + plotWidth])
          .paddingInner(0.42)
          .paddingOuter(0.3);
        const max = Math.max(...data.map((d) => d.value / unit));
        const floor = Math.round(height - margin.bottom);
        const pitch = rungPitch(floor - margin.top, max);
        const hero = props.highlight ?? maxIndex(data.map((d) => d.value));
        const label = data
          .map((d) => `${d.label} ${format(d.value)}`)
          .join(", ");

        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={tex("shade")} tone="fill-l4" />
              <CrossHatch id={tex("shade-hero")} tone="fill-l3" />
            </defs>
            <HRule
              x0={Math.round(x0)}
              x1={Math.round(x0 + plotWidth)}
              y={floor}
            />
            {data.map((datum, index) => {
              const left = x(index) ?? 0;
              const rungs = Math.round(datum.value / unit);
              return (
                <LadderBar
                  key={datum.label}
                  bandwidth={x.bandwidth()}
                  datum={datum}
                  dim={hover.dim(index)}
                  floor={floor}
                  format={format}
                  hero={hero === index}
                  index={index}
                  left={left}
                  pitch={pitch}
                  rungs={rungs}
                  tex={tex}
                  onEnter={() => {
                    hover.show(
                      index,
                      left + x.bandwidth() / 2,
                      rungY(floor, rungs - 1, pitch) - 22
                    );
                  }}
                />
              );
            })}
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
