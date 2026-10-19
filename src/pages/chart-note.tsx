import { ABOUT, SOURCES } from "../gallery/sources";
import type { GalleryEntry } from "../gallery/types";

/**
 * The (i), drawn at the rule's weight: a 1px ring, its dot and its stem. The
 * note hangs from the glyph, not the 44px target round it, so its edge lines
 * up with the ring.
 */
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
 * A chart's (i) and the note it opens: one sentence on what the numbers are,
 * then each source, linked. The note is a native popover hung from the
 * button (see note-pop in app.css), so a click outside or Escape closes it
 * and Tab moves from the button into its links.
 */
export const ChartNote = (props: { entry: GalleryEntry }) => {
  const { id, name } = props.entry;
  const text = ABOUT[id];
  if (text === undefined) {
    return null;
  }
  const sources = SOURCES.filter((s) => s.id === id);
  const note = `note-${id}`;
  return (
    <>
      <button
        aria-label={`About ${name}`}
        className="text-muted hover:text-text focus-visible:outline-muted [&:has(+:popover-open)]:text-text -my-3 -mr-3.5 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors focus-visible:outline-1 focus-visible:-outline-offset-8 focus-visible:outline-solid"
        popoverTarget={note}
        type="button"
      >
        <InfoGlyph anchor={`--${note}`} />
      </button>
      <div
        className="note-pop rounded-tip bg-ink text-paper text-small border-0 p-4"
        id={note}
        popover="auto"
        style={{ positionAnchor: `--${note}` }}
      >
        <p className="m-0">{text}</p>
        {sources.length === 0 ? null : (
          <ul className="border-paper/20 m-0 mt-3 flex list-none flex-col gap-2 border-t p-0 pt-3">
            {sources.map((s) => (
              <li key={s.url}>
                <a
                  className="text-paper decoration-paper/40 hover:decoration-paper focus-visible:outline-paper underline underline-offset-2 transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid"
                  href={s.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {s.title}
                </a>
                <span className="text-paper/60 block">{s.publisher}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};
