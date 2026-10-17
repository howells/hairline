import { scaleLinear } from "d3-scale";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { Control } from "../control";
import { Plot, Tooltip } from "../core";
import { useHover, useReducedMotion, useReveal } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Bar, Dot, Ring } from "../markers";
import { easeTravel } from "../motion";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, sansWidth } from "../util";
import { barRaceDemo } from "./bar-race.data";
import type { RaceData, RaceSeries } from "./bar-race.data";
import { ControlSlot } from "./control-slot";
import { labelRoom, textWidth } from "./util-a";
import { CONTROL_SLOT_H, useInView } from "./util-b";

interface BarRaceProps {
  data?: RaceData;
  height?: number;
  format?: (v: number) => string;
  /** Milliseconds per period. */
  speed?: number;
  note?: string;
  /** Label of a series to keep in the hero colour whatever its rank. */
  highlight?: string;
}

interface Standing {
  i: number;
  v: number;
}

const millions = (v: number) => `${Math.round(v)}m`;

/**
 * Period labels in the broadsheet style, for the stops that show: "Q1 2025"
 * splits into a quarter and a year, and the year is printed on the first
 * shown stop and wherever it changes ("Q1 2025 · Q3 · Q1 2026 · Q3"). The
 * current period always reads in full. Labels without a year pass through.
 */
const periodLabels = (periods: string[], shown: number[], current: number) => {
  const out = new Map<number, string>();
  let year = "";
  for (const k of shown) {
    const [part, y = ""] = periods[k].split(" ");
    out.set(k, y !== year || k === current ? periods[k] : part);
    year = y;
  }
  return out;
};

/** Values at fractional period `t`, easing into each period so the race settles on every one. */
const valuesAt = (data: RaceData, t: number) => {
  const last = data.periods.length - 1;
  const i0 = Math.max(0, Math.min(last, Math.floor(t)));
  const i1 = Math.min(last, i0 + 1);
  const f = easeTravel(Math.max(0, Math.min(1, t - i0)));
  return data.series.map(
    (s) => s.values[i0] + (s.values[i1] - s.values[i0]) * f
  );
};

/**
 * The race clock. Runs only once revealed and while on screen; under reduced
 * motion it starts on the final period and Play steps period by period.
 */
const useRaceClock = (
  box: RefObject<HTMLDivElement | null>,
  last: number,
  speed: number
) => {
  const revealed = useReveal(box);
  const inView = useInView(box);
  const reduced = useReducedMotion();
  const [t, setT] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? last : 0
  );
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const running = playing && revealed && inView && t < last;

  useEffect(() => {
    let raf = 0;
    let timer = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - prev);
      prev = now;
      setT((cur) => Math.min(last, cur + dt / speed));
      raf = requestAnimationFrame(tick);
    };
    if (running && reduced) {
      timer = window.setInterval(() => {
        setT((cur) => Math.min(last, Math.floor(cur) + 1));
      }, 900);
    } else if (running) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
    };
  }, [running, reduced, speed, last]);

  const done = t >= last;
  const handleToggle = () => {
    if (done) {
      setT(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  };
  const handleSeek = (k: number) => {
    setPlaying(false);
    setT(k);
  };
  return {
    done,
    handleSeek,
    handleToggle,
    playing: playing && !done,
    reduced,
    t,
  };
};

interface TrackProps {
  current: string;
  /** Where the track starts: under the bars' left edge. */
  left: number;
  narrow: boolean;
  onSeek: (k: number) => void;
  periods: string[];
  t: number;
  width: number;
  y: number;
}

/** Room kept between two stop labels, px. */
const LABEL_GAP = 8;

/**
 * The stops labelled on a narrow track: each year's first period and the
 * current one. A year's first period gives way when it would touch the
 * current period's label.
 */
const narrowStops = (
  periods: string[],
  cur: number,
  x: (k: number) => number
) => {
  const last = periods.length - 1;
  // Horizontal extent of a stop's full label as the track sets it.
  const extent = (k: number) => {
    const w = sansWidth(periods[k], 11);
    const left = k === last ? x(k) + 4 - w : x(k) - w / 2;
    return { left, right: left + w };
  };
  const here = extent(cur);
  const firsts = periods.flatMap((p, k) =>
    k === 0 || periods[k - 1].split(" ")[1] !== p.split(" ")[1] ? [k] : []
  );
  return [
    ...firsts.filter((k) => {
      const e = extent(k);
      return (
        k !== cur &&
        (e.right + LABEL_GAP < here.left || e.left > here.right + LABEL_GAP)
      );
    }),
    cur,
  ].toSorted((a, b) => a - b);
};

/**
 * Period scrubber: a hairline with one stop per period, the elapsed part a
 * 2px ink rule. The current period's label is the race's only date. Click a
 * stop to jump.
 */
const Track = (p: TrackProps) => {
  const last = p.periods.length - 1;
  const x = scaleLinear()
    .domain([0, last])
    .range([p.left, p.width - 4]);
  const cur = p.periods.indexOf(p.current);
  // Narrow: each year's first period and the current one, in full.
  const labels = p.narrow
    ? new Map(narrowStops(p.periods, cur, x).map((k) => [k, p.periods[k]]))
    : periodLabels(
        p.periods,
        p.periods.map((_, k) => k),
        cur
      );
  return (
    <g>
      <HRule kind="rule" x0={x(0)} x1={x(last)} y={p.y} />
      <line
        className="stroke-ink"
        x1={x(0)}
        x2={x(p.t)}
        y1={Math.round(p.y)}
        y2={Math.round(p.y)}
        strokeWidth={2}
      />
      {/* One 44px-tall target along the whole track: a tap seeks the nearest stop. */}
      <HitRect
        className="cursor-pointer"
        x={x(0) - 22}
        y={p.y - 30}
        width={x(last) - x(0) + 44}
        height={44}
        onClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const local =
            x(0) -
            22 +
            ((e.clientX - box.left) / box.width) * (x(last) - x(0) + 44);
          p.onSeek(Math.max(0, Math.min(last, Math.round(x.invert(local)))));
        }}
      />
      {p.periods.map((period, k) => {
        const passed = k <= p.t;
        const text = labels.get(k);
        return (
          <g key={period} className="pointer-events-none">
            {passed ? (
              <Dot className="fill-hero" cx={x(k)} cy={p.y} size="sm" />
            ) : (
              <Ring className="stroke-l5" cx={x(k)} cy={p.y} size="sm" />
            )}
            {text === undefined ? null : (
              <Label
                anchor={k === last ? "end" : "middle"}
                dx={k === last ? 4 : 0}
                voice={period === p.current ? "value" : "axis"}
                x={x(k)}
                y={p.y - 10}
              >
                {text}
              </Label>
            )}
          </g>
        );
      })}
    </g>
  );
};

interface RacerProps {
  barH: number;
  /** Reduced motion: the bar jumps to its new rank with no travel. */
  jump: boolean;
  dimmed: boolean;
  /** Solid fill class, or undefined to engrave the bar. */
  fill: string | undefined;
  /** Pattern id of the hatch for engraved bars. */
  hatch: string;
  labelX: number;
  leader: boolean;
  onEnter: (x: number, y: number) => void;
  pitch: number;
  series: RaceSeries;
  value: string;
  w: number;
  width: number;
  y: number;
}

/** One racer: label, squared bar and value, sliding to its rank's row. */
const Racer = (p: RacerProps) => (
  <DimGroup
    className={
      p.jump ? undefined : "ease-travel duration-change transition-transform"
    }
    dim={p.dimmed}
    style={{ transform: `translateY(${Math.round(p.y)}px)` }}
    onPointerEnter={() => {
      p.onEnter(p.labelX + p.w / 2, p.y - p.barH / 2 - 4);
    }}
  >
    <HitRect x={0} y={-p.pitch / 2} width={p.width} height={p.pitch} />
    <Label
      anchor="end"
      dy="0.35em"
      muted={!p.leader}
      voice="name"
      x={p.labelX - 10}
      y={0}
    >
      {p.series.label}
    </Label>
    <Bar
      className={p.fill}
      dir="right"
      fill={p.fill === undefined ? paint(p.hatch) : undefined}
      h={p.barH}
      w={p.w}
      x={p.labelX}
      y={-p.barH / 2}
    />
    <Label
      dy="0.36em"
      muted={!p.leader}
      voice="value"
      x={p.labelX + p.w + 8}
      y={0}
    >
      {p.value}
    </Label>
  </DimGroup>
);

const PlayIcon = (props: { done: boolean; playing: boolean }) => {
  if (props.done) {
    return (
      <path
        d="M7.5 3.2A3.6 3.6 0 1 0 8 6"
        className="fill-none stroke-current"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    );
  }
  if (props.playing) {
    return <path d="M1 1h2.4v8H1zM5.6 1H8v8H5.6z" className="fill-current" />;
  }
  return <path d="M1 0.8 8.4 5 1 9.2z" className="fill-current" />;
};

const buttonText = (done: boolean, playing: boolean) => {
  if (done) {
    return "Replay";
  }
  return playing ? "Pause" : "Play";
};

/** Side margins: room for the names, and for the widest value after the longest bar. */
const margins = (data: RaceData, format: (v: number) => string) => ({
  bottom: 44,
  // The longest name, or half the first stop's label if that is wider.
  left: Math.max(
    labelRoom(
      data.series.map((s) => s.label),
      "t-name"
    ) + 10,
    Math.ceil(textWidth(data.periods[0], "t-axis") / 2)
  ),
  right:
    8 +
    labelRoom(
      data.series.flatMap((s) => s.values.map((v) => format(v))),
      "t-value"
    ),
  top: 4,
});

/**
 * G16 Busiest stations. A ranking that re-sorts as the values animate through
 * the periods. Bars are squared with a 2px corner; the leader is solid ink
 * and the rest are hatched inside a crisp 1px outline. The scrubber's current period is the only date. Starts
 * when scrolled into view, pauses off-screen, and shows the final period
 * under reduced motion.
 */
export const BarRace = (props: BarRaceProps) => {
  const data = props.data ?? barRaceDemo;
  // The plot's share of the height, under the control slot.
  const height = (props.height ?? 460) - CONTROL_SLOT_H;
  const format = props.format ?? millions;
  const last = data.periods.length - 1;
  const box = useRef<HTMLDivElement>(null);
  const tex = useTextureIds("race");
  const hatch = tex("hatch");
  const clock = useRaceClock(box, last, props.speed ?? 1500);
  const hover = useHover<number>();

  const values = valuesAt(data, clock.t);
  const order: Standing[] = values
    .map((v, i) => ({ i, v }))
    .toSorted((a, b) => b.v - a.v);
  const rank = Array.from({ length: values.length }, () => 0);
  for (const [r, s] of order.entries()) {
    rank[s.i] = r;
  }
  const period = data.periods[Math.min(last, Math.round(clock.t))];
  const label = `Bar race, ${data.periods[0]} to ${data.periods[last]}. ${period}: ${order.map((s) => `${data.series[s.i].label} ${format(s.v)}`).join(", ")}`;
  const action = buttonText(clock.done, clock.playing);

  return (
    <div ref={box} className="relative">
      <ControlSlot>
        <Control onClick={clock.handleToggle} label={`${action} the race`}>
          <svg width={9} height={10} viewBox="0 0 9 10" aria-hidden>
            <PlayIcon done={clock.done} playing={clock.playing} />
          </svg>
          {action}
        </Control>
      </ControlSlot>
      <Plot
        overlay={
          hover.at === null ? null : (
            <Tooltip x={hover.at.x} y={hover.at.y}>
              <TipText
                facts={[
                  format(values[hover.at.key]),
                  `#${rank[hover.at.key] + 1} in ${period}`,
                ]}
                lead={data.series[hover.at.key].label}
              />
            </Tooltip>
          )
        }
      >
        {(width) => {
          const m = margins(data, format);
          const pitch = (height - m.top - m.bottom) / data.series.length;
          const x = scaleLinear()
            .domain([0, Math.max(1, order[0]?.v ?? 1)])
            .range([0, width - m.left - m.right]);
          const svgH = height + noteSpace(props.note, width - 16, 22);
          return (
            <ChartSvg
              height={svgH}
              label={label}
              leave={hover.clear}
              width={width}
            >
              <defs>
                <Hatch id={hatch} tone="fill-l4" />
              </defs>
              {data.series.map((s, i) => (
                <Racer
                  key={s.label}
                  barH={Math.min(36, pitch * 0.68)}
                  jump={clock.reduced}
                  dimmed={hover.dim(i)}
                  fill={
                    props.highlight === s.label || rank[i] === 0
                      ? "fill-hero"
                      : undefined
                  }
                  hatch={hatch}
                  labelX={m.left}
                  leader={rank[i] === 0}
                  onEnter={(tipX, tipY) => {
                    hover.show(i, tipX, tipY);
                  }}
                  pitch={pitch}
                  series={s}
                  value={format(values[i])}
                  w={x(values[i])}
                  width={width}
                  y={m.top + pitch * (rank[i] + 0.5)}
                />
              ))}
              <Track
                current={period}
                left={m.left}
                narrow={width < 520}
                onSeek={clock.handleSeek}
                periods={data.periods}
                t={clock.t}
                width={width}
                y={height - 14}
              />
              <FootNote height={svgH} text={props.note} width={width} />
            </ChartSvg>
          );
        }}
      </Plot>
    </div>
  );
};
