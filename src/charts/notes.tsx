import { crisp } from "./axes";
import { Dot } from "./markers";
import { DISC_R, placeDiscs, placeNotes } from "./note-layout";
import type { NotePoint, NoteRoom } from "./note-layout";
import { Label } from "./text";
import { stagger } from "./util";

/** A note as the chart's caller wrote it, resolved to its place on the plot. */
export type ChartNote = NotePoint;

/**
 * The notes on the plot. Wide: each beside its point, its words on a halo
 * on a thin leader. Narrow: a numbered ink disc by its point, the words in
 * <NoteList> under the chart.
 */
export const NoteMarks = (props: {
  notes: readonly ChartNote[];
  numbered: boolean;
  room: NoteRoom;
}) => (
  <g className="fade" style={stagger(14, "series")}>
    {props.notes.map((p) => (
      <Dot
        className="fill-ink"
        cx={p.x}
        cy={p.y}
        key={`${p.label}-dot`}
        size="sm"
      />
    ))}
    {props.numbered
      ? placeDiscs(props.notes, props.room).map((d) => (
          <g key={d.n}>
            <circle className="fill-ink" cx={d.x} cy={d.cy} r={DISC_R} />
            <Label
              anchor="middle"
              className="fill-paper"
              halo={false}
              middle
              voice="label"
              x={d.x}
              y={d.cy}
            >
              {d.n}
            </Label>
          </g>
        ))
      : placeNotes(props.notes, props.room).map((n) => (
          <g key={n.n}>
            <line
              className="rule"
              x1={crisp(n.x)}
              x2={crisp(n.x)}
              y1={n.leader.y0}
              y2={n.leader.y1}
            />
            <Label
              anchor={n.anchor}
              className="fill-ink"
              voice="label"
              x={n.x}
              y={n.titleY}
            >
              {n.label}
            </Label>
            {n.detail === undefined ? null : (
              <Label anchor={n.anchor} muted voice="axis" x={n.x} y={n.detailY}>
                {n.detail}
              </Label>
            )}
          </g>
        ))}
  </g>
);

/** The numbered words under a narrow chart: HTML, so it wraps and can be selected. */
export const NoteList = (props: {
  notes: readonly { detail?: string; label: string }[];
}) => (
  <ol className="text-tick m-0 flex list-none flex-col gap-3 p-0 pt-4">
    {props.notes.map((n, k) => (
      <li className="flex items-start gap-2.5" key={`${n.label}-${k}`}>
        <span
          aria-hidden="true"
          className="bg-ink text-paper inline-flex size-4 shrink-0 items-center justify-center rounded-full font-medium tabular-nums"
        >
          {k + 1}
        </span>
        <span className="flex flex-col">
          <span className="text-ink font-semibold">{n.label}</span>
          {n.detail === undefined ? null : (
            <span className="text-muted">{n.detail}</span>
          )}
        </span>
      </li>
    ))}
  </ol>
);
