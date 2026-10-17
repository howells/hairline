import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { useSvgId } from "../hooks";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { pictorialBarDemo } from "./pictorial-bar.data";
import type { PictorialDatum } from "./pictorial-bar.data";
import { labelRoom, rankTones } from "./util-a";

interface PictorialBarProps {
  data?: PictorialDatum[];
  /** Amount one icon stands for (same units as `value`). */
  unit?: number;
  height?: number;
  format?: (v: number) => string;
  /** Footnote. */
  note?: string;
  /** Index of the row to draw in the hero colour. */
  highlight?: number;
}

interface Tip {
  i: number;
  x: number;
  y: number;
}

interface Row {
  datum: PictorialDatum;
  i: number;
  /** Icons' worth, fractional. */
  n: number;
  cy: number;
  /** Where the counted pages are cut off on each line, on a whole pixel. */
  cuts: number[];
}

interface Geometry {
  x0: number;
  pitch: number;
  /** Icon box in whole px. */
  iw: number;
  ih: number;
  /** Lines of pages per track: two on a phone, so the pages stay legible. */
  lines: number;
  /** Pages on one line. */
  perLine: number;
  rowH: number;
  slots: number;
}

/** Gap between a track's two lines of pages, px. */
const LINE_GAP = 4;

/** The page's proportions: 18 × 24, its top corner folded over. */
const ICON_W = 18;
const ICON_H = 24;
const FOLD = 7.5 / 18;
/** Room for the longest row name and the gap before the icons. */
const nameRoom = (data: PictorialDatum[]) =>
  labelRoom(
    data.map((d) => d.label),
    "t-label"
  ) + 18;

/**
 * Where the icons start: after the names, moved right so the whole row (names,
 * icons and values) is centred when the icons stop growing before the plot ends.
 */
const rowOrigin = (
  width: number,
  names: number,
  track: number,
  valueW: number
) =>
  names +
  Math.max(0, Math.floor((width - names - track - 10 - valueW - 4) / 2));

/** Width of the widest value label. */
const valueWidth = (data: PictorialDatum[], format: (v: number) => string) =>
  labelRoom(
    data.map((d) => format(d.value)),
    "t-value"
  );

const defaultFormat = (v: number) => `${v}k words`;

/**
 * A page outline in a `w` × `h` box of whole pixels: a 1px rule on the
 * pixel grid, the top right corner folded over. `body` is the closed page,
 * `fold` the crease.
 */
const pagePaths = (w: number, h: number) => {
  const f = Math.max(2, Math.round(w * FOLD));
  const r = w - 0.5;
  const b = h - 0.5;
  return {
    body: `M0.5 0.5H${r - f}L${r} ${0.5 + f}V${b}H0.5Z`,
    fold: `M${r - f} 0.5V${0.5 + f}H${r}`,
  };
};

interface PageGlyphProps {
  /** Pattern fill for a counted page; omit for an empty one. */
  fill?: string;
  h: number;
  /** Outline tone class. */
  tone: string;
  w: number;
  x: number;
  y: number;
}

/**
 * One page glyph, translated to its own whole-pixel corner so its texture
 * starts the same way inside every page.
 */
const PageGlyph = (p: PageGlyphProps) => {
  const d = pagePaths(p.w, p.h);
  return (
    <g
      className={`${p.tone} shape-crisp`}
      fill="none"
      strokeLinejoin="round"
      strokeWidth={1}
      transform={`translate(${p.x} ${p.y})`}
    >
      <path
        className={p.fill === undefined ? "fill-paper" : undefined}
        d={d.body}
        fill={p.fill}
      />
      <path d={d.fold} />
    </g>
  );
};

interface RowProps {
  row: Row;
  g: Geometry;
  /** The inked row: its pages and value in ink, the others in grey. */
  hero: boolean;
  id: string;
  /** Pattern fill of this row's counted pages. */
  texture: string;
  width: number;
  dim: boolean;
  label: string;
  onEnter: () => void;
}

/** One track: the empty pages, the counted pages clipped to the value, the value after the track. */
const PictorialRow = ({
  row,
  g,
  hero,
  id,
  texture,
  width,
  dim,
  label,
  onEnter,
}: RowProps) => {
  const top = Math.round(
    row.cy - (g.lines * g.ih + (g.lines - 1) * LINE_GAP) / 2
  );
  const icons = Array.from({ length: g.slots }, (_, k) => ({
    id: `${row.datum.label}-${k}`,
    x: Math.round(g.x0 + (k % g.perLine) * g.pitch + (g.pitch - g.iw) / 2),
    y: top + Math.floor(k / g.perLine) * (g.ih + LINE_GAP),
  }));
  return (
    <g className={dimClass(dim)} onPointerEnter={onEnter}>
      <rect
        x={0}
        y={row.cy - g.rowH / 2}
        width={width}
        height={g.rowH}
        fill="transparent"
      />
      <text
        className="t-label fill-muted"
        x={g.x0 - 14}
        y={row.cy}
        dy="0.35em"
        textAnchor="end"
      >
        {row.datum.label}
      </text>
      <g>
        {icons.map((ic) => (
          <PageGlyph
            key={ic.id}
            h={g.ih}
            tone="stroke-l5"
            w={g.iw}
            x={ic.x}
            y={ic.y}
          />
        ))}
      </g>
      <g clipPath={`url(#${id}-c${row.i})`}>
        {icons.map((ic) => (
          <PageGlyph
            key={ic.id}
            fill={texture}
            h={g.ih}
            tone={hero ? "stroke-ink" : "stroke-l3"}
            w={g.iw}
            x={ic.x}
            y={ic.y}
          />
        ))}
      </g>
      <text
        className={`fade t-value ${hero ? "" : "fill-muted"}`}
        style={stagger(row.i + 4, "series")}
        x={g.x0 + g.perLine * g.pitch + 10}
        y={row.cy}
        dy="0.35em"
      >
        {label}
      </text>
    </g>
  );
};

/** One clip per track: a rect per line of pages, cut at the value. */
const TrackClips = (p: { g: Geometry; id: string; rows: Row[] }) => {
  const blockH = p.g.lines * p.g.ih + (p.g.lines - 1) * LINE_GAP;
  return (
    <>
      {p.rows.map((r) => (
        <clipPath key={r.datum.label} id={`${p.id}-c${r.i}`}>
          {r.cuts.map((cut, line) => (
            <rect
              // One rect per line of pages, top line first.
              key={`line-${String(line)}`}
              className="grow-x"
              style={stagger(r.i + line, "series")}
              x={p.g.x0}
              y={r.cy - blockH / 2 + line * (p.g.ih + LINE_GAP) - 1}
              width={cut - p.g.x0}
              height={p.g.ih + 2}
            />
          ))}
        </clipPath>
      ))}
    </>
  );
};

/**
 * G5 Long novels. Each row is a track of page glyphs; one page =
 * `unit`. Every page is a 1px outline; the counted pages are filled with
 * the row's hatch and the last is cut to the remainder. Only the biggest
 * row is inked; the others are engraved in one grey.
 */
export const PictorialBar = (props: PictorialBarProps) => {
  const data = props.data ?? pictorialBarDemo;
  const unit = props.unit ?? 50;
  const height = props.height ?? 320;
  const format = props.format ?? defaultFormat;
  const id = useSvgId("pict");
  const tex = useTextureIds("pict");
  const [tip, setTip] = useState<Tip | null>(null);
  // The biggest row in ink; every other row's filled icons at one grey.
  const tones = rankTones(
    data.map((d) => d.value),
    [0, 4]
  );
  const isHero = (i: number) =>
    props.highlight === undefined ? tones[i] === 0 : props.highlight === i;
  const slots = Math.ceil(Math.max(...data.map((d) => d.value)) / unit);
  const label = `One page = ${unit}k words. ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        // Room for the longest row label, set flush right against the icons.
        const names = nameRoom(data);
        // The values stand in one column after the track.
        const valueW = valueWidth(data, format);
        const right = Math.max(48, valueW + 18);
        const lines = width < 460 ? 2 : 1;
        const perLine = Math.ceil(slots / lines);
        const pitch = Math.min(30, (width - names - right) / perLine);
        const x0 = rowOrigin(width, names, perLine * pitch, valueW);
        const scale = Math.min(1.1, (pitch * 0.82) / ICON_W);
        const noteH = noteSpace(props.note, width - 16, 22);
        // Small icons on a phone sit closer together, so the rows close up.
        const rowH = Math.min(
          (height - 16 - noteH) / data.length,
          width < 460 ? 64 : Number.POSITIVE_INFINITY
        );
        const svgH = 16 + rowH * data.length + noteH;
        const g: Geometry = {
          ih: Math.round(ICON_H * scale),
          iw: Math.round(ICON_W * scale),
          lines,
          perLine,
          pitch,
          rowH,
          slots,
          x0,
        };
        const rows: Row[] = data.map((datum, i) => {
          const n = datum.value / unit;
          return {
            cuts: Array.from({ length: lines }, (_, line) => {
              const count = Math.max(0, Math.min(perLine, n - line * perLine));
              const whole = Math.floor(count);
              return count >= perLine
                ? x0 + perLine * pitch
                : Math.round(
                    x0 +
                      whole * pitch +
                      (pitch - g.iw) / 2 +
                      (count - whole) * g.iw
                  );
            }),
            cy: 8 + (i + 0.5) * g.rowH,
            datum,
            i,
            n,
          };
        });

        return (
          <svg
            width={width}
            height={svgH}
            aria-label={label}
            onPointerLeave={() => {
              setTip(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <Hatch id={tex("row")} tone="fill-l3" />
              <Hatch id={tex("hero")} tone="fill-hero" />
              <TrackClips g={g} id={id} rows={rows} />
            </defs>
            {rows.map((r) => (
              <PictorialRow
                key={r.datum.label}
                row={r}
                g={g}
                hero={isHero(r.i)}
                id={id}
                texture={paint(tex(isHero(r.i) ? "hero" : "row"))}
                width={width}
                dim={tip !== null && tip.i !== r.i}
                label={format(r.datum.value)}
                onEnter={() => {
                  setTip({
                    i: r.i,
                    x: x0 + Math.min(r.n, perLine) * pitch,
                    y: r.cy - (lines * g.ih + (lines - 1) * LINE_GAP) / 2 - 4,
                  });
                }}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={svgH - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
