import { scaleBand, scaleLinear } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Bar } from "../markers";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, stagger } from "../util";
import { chunkyBarsDemo } from "./chunky-bars.data";
import type { ChunkyDatum } from "./chunky-bars.data";
import { rankTones } from "./util-a";

interface ChunkyBarsProps {
  data?: ChunkyDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Footnote under the labels. */
  note?: string;
  /** Index of the bar to draw in the hero colour. */
  highlight?: number;
}

interface BarMarkProps {
  bw: number;
  cx: number;
  floor: number;
  /** Pattern id of the hatch fill. */
  hatch: string;
  hero: boolean;
  i: number;
  top: number;
}

/** The hero bar in solid ink; any other bar hatched inside a crisp 1px outline. */
const BarMark = (p: BarMarkProps) => (
  <Bar
    className={p.hero ? "grow-y fill-hero" : "grow-y"}
    dir="up"
    fill={p.hero ? undefined : paint(p.hatch)}
    h={p.floor - p.top}
    style={stagger(p.i, "series")}
    w={p.bw}
    x={p.cx - p.bw / 2}
    y={p.top}
  />
);

/** The data is in pence: 477 reads £4.77. */
const defaultFormat = (v: number) => `£${(v / 100).toFixed(2)}`;

/**
 * G3 A pint over time. A handful of wide bars, squared off with a 2px corner,
 * standing on a hairline baseline with the value above each. The leader is
 * solid ink; the rest are engraved: 45° hatching in one grey inside a crisp
 * 1px outline.
 */
export const ChunkyBars = (props: ChunkyBarsProps) => {
  const data = props.data ?? chunkyBarsDemo;
  const height = props.height ?? 400;
  const format = props.format ?? defaultFormat;
  const hover = useHover<number>();
  const tex = useTextureIds("bars");
  const hatch = tex("hatch");
  // The leader in ink, every other bar engraved in one grey.
  const tones = rankTones(
    data.map((d) => d.value),
    [0, 4]
  );
  const label = data.map((d) => `${d.label} ${format(d.value)}`).join(", ");

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
        const narrow = width < 460;
        const m = {
          bottom: 34 + noteSpace(props.note, width - 16, 18),
          left: 8,
          right: 8,
          top: 40,
        };
        const x = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([m.left, width - m.right])
          .paddingInner(narrow ? 0.38 : 0.58)
          .paddingOuter(0.25);
        const bw = Math.min(x.bandwidth(), 96);
        const floor = height - m.bottom;
        const y = scaleLinear()
          .domain([0, Math.max(...data.map((d) => d.value))])
          .range([floor, m.top]);

        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={hatch} tone="fill-l4" />
            </defs>
            {data.map((d, i) => {
              const cx = (x(i) ?? 0) + x.bandwidth() / 2;
              const top = y(d.value);
              return (
                <DimGroup
                  dim={hover.dim(i)}
                  key={d.label}
                  onPointerEnter={() => {
                    hover.show(i, cx, top - 34);
                  }}
                >
                  <HitRect
                    height={floor - m.top + 60}
                    width={bw + 16}
                    x={cx - bw / 2 - 8}
                    y={m.top - 36}
                  />
                  <BarMark
                    bw={bw}
                    cx={cx}
                    floor={floor}
                    hatch={hatch}
                    hero={tones[i] === 0 || props.highlight === i}
                    i={i}
                    top={top}
                  />
                  <Label
                    anchor="middle"
                    muted={tones[i] !== 0}
                    order={i + 3}
                    tier="series"
                    voice="value"
                    x={cx}
                    y={top - 10}
                  >
                    {format(d.value)}
                  </Label>
                  <Label
                    anchor="middle"
                    muted
                    voice="label"
                    x={cx}
                    y={floor + 20}
                  >
                    {d.label}
                  </Label>
                </DimGroup>
              );
            })}
            <HRule x0={m.left} x1={width - m.right} y={floor} />
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
