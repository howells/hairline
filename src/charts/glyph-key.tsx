import type { ReactNode } from "react";

import { DataTable } from "./data-table";
import { GLYPH_KEY_HEIGHT, GLYPH_KEY_PAD } from "./glyph-box";
import type { GlyphBox, GlyphPart } from "./glyph-box";
import { leaderOrder } from "./glyph-leaders";
import { HRule } from "./rules";
import { ChartSvg } from "./svg";
import { Label } from "./text";

interface GlyphKeyProps {
  /** The box the glyph is drawn in: `glyphBox(width)`. */
  box: GlyphBox;
  /** The chart's own glyph, drawn large inside `box`. */
  children: ReactNode;
  /** Patterns the glyph is filled with (`<Hatch id=… />`); they belong inside the key's svg. */
  defs?: ReactNode;
  /** Names the exemplar for screen readers: "How to read one flare: M6.4 at 14:20 UTC". */
  label: string;
  /** The labelled parts, each a point on the glyph, in any order: the key sets them so no leader crosses another. */
  parts: GlyphPart[];
  /** Which record the glyph draws, in the chart's own words: "Brazil, 2019". */
  record: string;
  width: number;
}

/** Gap between the glyph's box and the labels' column. */
const LABEL_GAP = 40;
/** Where a label's second line sits below its first. */
const DETAIL_DROP = 14;
/** Where the leader meets a label, below the title's baseline. */
const LEADER_DROP = -4;

/**
 * A legend that is one glyph: one record of the chart's own glyph drawn
 * large, each part named where it is by a thin leader to a label (halo type,
 * a title and what it encodes), then the chart itself follows as the set.
 * The chart draws its own glyph as `children` and passes the points to
 * label, so the key is never a second drawing of the glyph. The data is a
 * real record the chart chooses, never invented. The parts are also a table,
 * hidden but read out.
 */
export const GlyphKey = (props: GlyphKeyProps) => {
  const { box } = props;
  const labelX = Math.round(box.cx + box.size / 2 + LABEL_GAP);
  const count = props.parts.length;
  const row = (GLYPH_KEY_HEIGHT - GLYPH_KEY_PAD * 2) / count;
  const ys = props.parts.map((_, k) =>
    Math.round(GLYPH_KEY_PAD + row * k + row / 2)
  );
  // The order of the labels that lets no two leaders cross.
  const order = leaderOrder(
    props.parts.map((p) => p.at),
    ys.map((y) => [labelX - 8, y + LEADER_DROP])
  );
  const rows = order.map((a, k) => ({ part: props.parts[a], y: ys[k] }));
  const parts = rows.map((r) => r.part);
  const meanings = parts.map((p) => `${p.name}: ${p.detail}`);
  return (
    <div>
      <ChartSvg
        desc={`${meanings.join(". ")}.`}
        height={GLYPH_KEY_HEIGHT}
        label={props.label}
        width={props.width}
      >
        {props.defs === undefined ? null : <defs>{props.defs}</defs>}
        {props.children}
        <Label
          anchor="middle"
          halo
          voice="axis"
          x={box.cx}
          y={GLYPH_KEY_PAD + box.size + 16}
        >
          {props.record}
        </Label>
        {rows.map(({ part, y }) => (
          <g key={part.name}>
            <line
              className="rule shape-smooth"
              x1={part.at[0]}
              x2={labelX - 8}
              y1={part.at[1]}
              y2={y + LEADER_DROP}
            />
            <circle
              className="fill-ink"
              cx={part.at[0]}
              cy={part.at[1]}
              r={2}
            />
            <Label halo voice="label" x={labelX} y={y}>
              {part.name}
            </Label>
            <Label halo voice="axis" x={labelX} y={y + DETAIL_DROP}>
              {part.detail}
            </Label>
          </g>
        ))}
        <HRule kind="rule" x0={0} x1={props.width} y={GLYPH_KEY_HEIGHT - 1} />
      </ChartSvg>
      <DataTable
        caption={props.label}
        columns={["Part", "What it shows"]}
        rows={parts.map((p) => [p.name, p.detail])}
      />
    </div>
  );
};
