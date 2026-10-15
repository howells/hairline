import { ALL_ENTRIES } from "../gallery/registry";
import { SOURCES } from "../gallery/sources";

/** Every chart that draws on real data, in grid order, with its sources. */
const credited = ALL_ENTRIES.flatMap((entry) => {
  const sources = SOURCES.filter((s) => s.id === entry.id);
  return sources.length === 0 ? [] : [{ entry, sources }];
});

/** The credits page: `#/sources`. */
export const Credits = () => (
  <main className="bg-paper grain mx-auto max-w-[760px] px-6 py-10 md:px-10">
    <h1 className="text-small text-text m-0 font-semibold">Sources</h1>
    <dl className="m-0 mt-8">
      {credited.map(({ entry, sources }) => (
        <div
          className="border-rule grid gap-1 border-t py-4 md:grid-cols-[12rem_1fr] md:gap-6"
          key={entry.id}
        >
          <dt className="text-small text-text">
            <a className="text-text no-underline" href={`#/chart/${entry.id}`}>
              {entry.name}
            </a>
          </dt>
          <dd className="m-0 flex flex-col gap-2">
            {sources.map((s) => (
              <p className="text-small text-muted m-0" key={s.url}>
                <a className="text-text" href={s.url}>
                  {s.publisher}, {s.title}
                </a>
                . {s.licence}.
              </p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  </main>
);
