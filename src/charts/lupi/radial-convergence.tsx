import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DotRing } from "../texture";
import { clamp, dimClass, noteSpace, sansWidth, stagger } from "../util";
import { radialConvergenceDemo } from "./radial-convergence.data";
import type { ConvergenceItem } from "./radial-convergence.data";
import { clock } from "./util-a";
import { argMax } from "./util-b";

interface RadialConvergenceProps {
  data?: ConvergenceItem[];
  height?: number;
  /** Noun for the tooltip, e.g. "request". */
  noun?: string;
  note?: string;
}

interface Hub {
  angle: number;
  count: number;
  theme: string;
  x: number;
  y: number;
}

interface Focus {
  item: number | null;
  theme: string;
}

interface RimGeometry {
  angle: (k: number) => number;
  cx: number;
  cy: number;
  R: number;
  /** Side labels set as two lines, name over count, to leave the rim room. */
  stacked: boolean;
  width: number;
}

/** Hub radius: area = count, scaled down with a small rim. */
const hubR = (n: number, R: number) => clamp(R / 90, 1.4, 2.2) * Math.sqrt(n);

/** Labels this far from straight up or down sit beside the rim. */
const SIDE = 0.35;

/** Mean of clock angles, done on the unit circle so 350° and 10° average to 0°. */
const meanAngle = (angles: number[]) => {
  const sx = angles.reduce((s, a) => s + Math.sin((a * Math.PI) / 180), 0);
  const sy = angles.reduce((s, a) => s + Math.cos((a * Math.PI) / 180), 0);
  return ((Math.atan2(sx, sy) * 180) / Math.PI + 360) % 360;
};

/** Each theme's mean clock angle on the rim and its item count. */
const themeAngles = (data: ConvergenceItem[]) =>
  [...new Set(data.map((d) => d.theme))].map((theme) => {
    const angles = data.flatMap((d, k) =>
      d.theme === theme ? [(360 * k) / data.length] : []
    );
    return { angle: meanAngle(angles), count: angles.length, theme };
  });

const buildHubs = (data: ConvergenceItem[], rim: RimGeometry): Hub[] =>
  themeAngles(data).map((t) => {
    const [x, y] = clock(rim.cx, rim.cy, rim.R * 0.34, t.angle);
    return { ...t, x, y };
  });

/** Width the widest side label needs, on one line or stacked. */
const sideLabelW = (data: ConvergenceItem[], stacked: boolean) =>
  Math.max(
    0,
    ...themeAngles(data).flatMap((t) => {
      if (Math.abs(Math.sin((t.angle * Math.PI) / 180)) <= SIDE) {
        return [];
      }
      return [sansWidth(stacked ? t.theme : `${t.theme} · ${t.count}`, 12)];
    })
  );

const ThemeLabel = (props: {
  focus: Focus | null;
  hero: boolean;
  hub: Hub;
  onEnter: () => void;
  rim: RimGeometry;
}) => {
  const { hub, rim } = props;
  const [px, ly] = clock(rim.cx, rim.cy, rim.R + 16, hub.angle);
  const side = Math.sin((hub.angle * Math.PI) / 180);
  const beside = Math.abs(side) > SIDE;
  const stack = beside && rim.stacked;
  const textW = stack
    ? sansWidth(hub.theme, 12)
    : sansWidth(`${hub.theme} · ${hub.count}`, 12);
  let anchor: "end" | "middle" | "start" = "middle";
  let lx = px;
  if (side > SIDE) {
    anchor = "start";
    lx = Math.min(px, rim.width - textW - 2);
  } else if (side < -SIDE) {
    anchor = "end";
    lx = Math.max(px, textW + 2);
  }
  const lit = props.focus === null || props.focus.theme === hub.theme;
  const tone = `fade t-label ${props.hero ? "" : "fill-muted"}`;
  return (
    <g className={dimClass(!lit)} onPointerEnter={props.onEnter}>
      {stack ? (
        <text className={tone} textAnchor={anchor} x={lx} y={ly}>
          <tspan x={lx} dy="-0.2em">
            {hub.theme}
          </tspan>
          <tspan x={lx} dy="1.25em">
            {hub.count}
          </tspan>
        </text>
      ) : (
        <text className={tone} dy="0.34em" textAnchor={anchor} x={lx} y={ly}>
          {hub.theme} · {hub.count}
        </text>
      )}
    </g>
  );
};

interface RimItemProps {
  focused: boolean;
  hub: Hub;
  k: number;
  lit: boolean;
  onEnter: (x: number, y: number) => void;
  rim: RimGeometry;
}

/** One item's hairline from the rim into its hub, with a hover target. */
const RimItem = ({ focused, hub, k, lit, onEnter, rim }: RimItemProps) => {
  const a = rim.angle(k);
  const [px, py] = clock(rim.cx, rim.cy, rim.R, a);
  const [c1x, c1y] = clock(rim.cx, rim.cy, rim.R * 0.52, a);
  const c2x = hub.x + (c1x - hub.x) * 0.25;
  const c2y = hub.y + (c1y - hub.y) * 0.25;
  return (
    <g
      className={lit ? "transition-opacity" : "opacity-25 transition-opacity"}
      onPointerEnter={() => {
        onEnter(px, py);
      }}
    >
      <path
        className={`draw ${focused ? "stroke-l3" : "stroke-l6"}`}
        d={`M${px},${py}C${c1x},${c1y} ${c2x},${c2y} ${hub.x},${hub.y}`}
        fill="none"
        pathLength={1}
        strokeWidth={1.5}
        style={stagger(k, "fine")}
      />
      <circle cx={px} cy={py} fill="transparent" r={7} />
    </g>
  );
};

/** The hubs, area = count, the largest in the hero colour. */
const HubDots = (props: {
  hero: string | undefined;
  hubs: Hub[];
  R: number;
}) => (
  <g>
    {props.hubs.map((hub) => (
      <circle
        className={`pop ${hub.theme === props.hero ? "fill-hero" : "fill-l3"}`}
        cx={hub.x}
        cy={hub.y}
        key={`hub-${hub.theme}`}
        r={hubR(hub.count, props.R)}
        style={{ "--i": 6 }}
      />
    ))}
  </g>
);

/**
 * The rim for a width: radius, centre and the plot height it needs. On
 * any width the rim shrinks until the widest theme label fits beside it.
 */
const rimFor = (
  width: number,
  height: number,
  data: ConvergenceItem[],
  noteH: number
) => {
  // Theme names reach this far above and below the rim.
  const reach = 28;
  const radiusFor = (stacked: boolean) =>
    clamp(
      Math.min(
        width / 2 - sideLabelW(data, stacked) - 22,
        (height - 2 * reach - noteH) / 2
      ),
      64,
      240
    );
  // Stack the side labels when one line would squeeze the rim.
  const stacked = radiusFor(false) < 130 && radiusFor(true) > radiusFor(false);
  const R = radiusFor(stacked);
  const n = data.length;
  const plotH = Math.min(height, Math.round(2 * (R + reach) + noteH));
  const rim: RimGeometry = {
    R,
    angle: (k) => (360 * k) / n,
    cx: width / 2,
    cy: (plotH - noteH) / 2,
    stacked,
    width,
  };
  return { plotH, rim };
};

/**
 * L5 Requests by theme. Many items on one dotted ring, each claimed by one
 * of a few themes; hairlines bundle inward to the theme's hub (area =
 * count). Only the hubs are labelled; items name themselves on hover.
 */
export const RadialConvergence = (props: RadialConvergenceProps) => {
  const data = props.data ?? radialConvergenceDemo;
  const height = props.height ?? 460;
  const noun = props.noun ?? "request";
  const [focus, setFocus] = useState<Focus | null>(null);
  const [tip, setTip] = useState<{
    label: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);
  const clear = () => {
    setFocus(null);
    setTip(null);
  };
  const lit = (theme: string, k: number) =>
    focus === null ||
    (focus.item === null ? focus.theme === theme : focus.item === k);

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{tip.label}</b> · {tip.value}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 20);
        const { plotH, rim } = rimFor(width, height, data, noteH);
        const hubs = buildHubs(data, rim);
        const hubOf = new Map(hubs.map((h) => [h.theme, h]));
        const hero = hubs.at(argMax(hubs.map((h) => h.count)))?.theme;
        return (
          <svg
            aria-label={`${data.length} items converging on ${hubs.length} themes: ${hubs.map((h) => `${h.theme} ${h.count}`).join(", ")}`}
            height={plotH}
            onPointerLeave={clear}
            width={width}
          >
            <title>Items on a rim bundled into theme hubs</title>
            <DotRing
              className="fade"
              cx={rim.cx}
              cy={rim.cy}
              r={rim.R}
              tone="fill-l4"
            />
            {hubs.map((hub) => (
              <ThemeLabel
                focus={focus}
                hero={hub.theme === hero}
                hub={hub}
                key={`label-${hub.theme}`}
                onEnter={() => {
                  setFocus({ item: null, theme: hub.theme });
                  setTip({
                    label: hub.theme,
                    value: `${hub.count} ${noun}s`,
                    x: hub.x,
                    y: hub.y - hubR(hub.count, rim.R) - 4,
                  });
                }}
                rim={rim}
              />
            ))}
            {data.map((d, k) => {
              const hub = hubOf.get(d.theme);
              if (hub === undefined) {
                return null;
              }
              return (
                <RimItem
                  focused={focus !== null}
                  hub={hub}
                  k={k}
                  key={d.id}
                  lit={lit(d.theme, k)}
                  onEnter={(x, y) => {
                    setFocus({ item: k, theme: d.theme });
                    setTip({ label: d.id, value: d.theme, x, y: y - 8 });
                  }}
                  rim={rim}
                />
              );
            })}
            <HubDots R={rim.R} hero={hero} hubs={hubs} />
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={plotH - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
