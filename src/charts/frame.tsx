import { useId } from "react";
import type { ReactNode } from "react";

export interface FrameProps {
  /** The chart. */
  children: ReactNode;
  /** A line under the chart for what the plot cannot say: a caveat, a date. */
  footnote?: ReactNode;
  /** The chart's name, above it and the figure's accessible name. */
  name: string;
  /** What the (i) opens: one sentence on what the numbers are. Without it there is no (i). */
  note?: ReactNode;
  /** Where the data comes from, under the chart. */
  source?: ReactNode;
}

/** The (i), drawn at the rule's weight: a 1px ring, its dot and its stem. */
const InfoGlyph = (props: { anchor: string }) => (
  <svg
    aria-hidden
    className="size-4"
    fill="none"
    style={{ anchorName: props.anchor }}
    viewBox="0 0 16 16"
  >
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
    <circle cx="8" cy="5.25" fill="currentColor" r="0.85" />
    <path d="M8 7.5v4" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

/**
 * The house frame, for hosts that want it: the chart's name and (i) above, the
 * chart centred in the room left, and a source line and footnote under it.
 * Charts draw only the plot, so a host that sets its own type can compose
 * these itself; this is the gallery's cell, made available. The note opens in
 * a native popover, so it needs no script.
 */
export const Frame = (props: FrameProps) => {
  const id = `hl-note-${useId().replaceAll(/[^\w-]/gu, "")}`;
  const hasFooter = props.source !== undefined || props.footnote !== undefined;

  return (
    <figure aria-label={props.name} className="m-0 flex min-w-0 flex-col gap-8">
      <figcaption className="text-text text-small flex items-center justify-between gap-4">
        {props.name}
        {props.note === undefined ? null : (
          <>
            <button
              aria-label={`About ${props.name}`}
              className="text-muted hover:text-text focus-visible:outline-muted [&:has(+:popover-open)]:text-text -my-3 -mr-3.5 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors focus-visible:outline-1 focus-visible:-outline-offset-8 focus-visible:outline-solid"
              popoverTarget={id}
              type="button"
            >
              <InfoGlyph anchor={`--${id}`} />
            </button>
            <div
              className="note-pop rounded-tip bg-ink text-paper text-small border-0 p-4"
              id={id}
              popover="auto"
              style={{ positionAnchor: `--${id}` }}
            >
              <p className="m-0">{props.note}</p>
            </div>
          </>
        )}
      </figcaption>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        {props.children}
      </div>
      {hasFooter ? (
        <footer className="text-muted text-small flex flex-col gap-1">
          {props.source === undefined ? null : (
            <p className="m-0">{props.source}</p>
          )}
          {props.footnote === undefined ? null : (
            <p className="m-0">{props.footnote}</p>
          )}
        </footer>
      ) : null}
    </figure>
  );
};
