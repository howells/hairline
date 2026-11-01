// HAI-1 Testing Decisions: payloads generated from each of the six schemas,
// including the awkward ones (empty, a single datum, negatives, NaN, null,
// duplicate labels). Whatever a host passes, a server render never throws and
// the markup never carries NaN or Infinity. The generators read like the
// schemas in src/schema/ and deliberately go past them; the registry rejects
// some of what they make, but the components must stay safe on all of it.
import {
  DumbbellQueue,
  HairlineArea,
  HairlineLine,
  PlumbScatter,
  RungBars,
  Slope,
} from "@howells/hairline";
import {
  assert,
  array,
  constant,
  constantFrom,
  double,
  integer,
  oneof,
  property,
} from "fast-check";
import type { Arbitrary } from "fast-check";
import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

// Few labels, so duplicates are common; a blank and a long one for the edges.
const label = constantFrom(
  "Oak",
  "Ash",
  "Oak",
  "",
  "A longer label for the edge",
  "Elm"
);

// Finite, negative, huge, tiny, NaN and the infinities.
const value = oneof(
  { arbitrary: double({ max: 1000, min: -1000, noNaN: true }), weight: 6 },
  { arbitrary: integer({ max: 100, min: -100 }), weight: 3 },
  { arbitrary: constantFrom(Number.NaN, 0, -0, 1e-9, 1e12, -1e12), weight: 2 },
  {
    arbitrary: constantFrom(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
    weight: 1,
  }
);

const reading = oneof(value, constantFrom(null));

// Any length from empty to a little over the schemas' limits.
const upTo = <T>(item: Arbitrary<T>, max: number) =>
  array(item, { maxLength: max });

const date = oneof(
  {
    arbitrary: integer({ max: 20, min: 1 }).map(
      (d) => `2024-03-${String(d).padStart(2, "0")}`
    ),
    weight: 8,
  },
  { arbitrary: constantFrom("not-a-date", "2024-13-45", ""), weight: 1 }
);

const size = oneof(
  { arbitrary: constantFrom({ height: 320, width: 480 }), weight: 3 },
  { arbitrary: constantFrom({ height: 120, width: 90 }), weight: 1 },
  { arbitrary: constantFrom({ height: 320, initialWidth: 480 }), weight: 2 }
);

// No emphasis at all, or one that may or may not name a datum.
const emphasis = oneof(
  constant({}),
  label.map((name) => ({ emphasis: name }))
);

const rungBars = upTo(
  oneof(
    label.chain((l) => value.map((v) => ({ label: l, value: v }))),
    label.map((l) => ({ id: `${l}-id`, label: l, value: 3 }))
  ),
  26
).chain((data) =>
  size.chain((s) => emphasis.map((e) => ({ data, ...e, ...s })))
);

const dumbbellQueue = upTo(
  label.chain((l) =>
    value.chain((before) => value.map((after) => ({ after, before, label: l })))
  ),
  14
).chain((data) =>
  size.chain((s) => emphasis.map((e) => ({ data, ...e, ...s })))
);

const plumbScatter = upTo(
  label.chain((l) =>
    value.chain((x) => value.map((y) => ({ label: l, x, y })))
  ),
  22
).chain((data) =>
  size.chain((s) => emphasis.map((e) => ({ data, ...e, ...s })))
);

const YEARS: [string, string] = ["2023", "2024"];

const slope = upTo(
  label.chain((l) =>
    value.chain((from) => value.map((to) => ({ from, name: l, to })))
  ),
  14
).chain((rows) =>
  size.chain((s) =>
    emphasis.map((e) => ({
      ...e,
      labels: YEARS,
      rows,
      ...s,
    }))
  )
);

const daily = upTo(
  date.chain((d) => reading.map((v) => ({ date: d, value: v }))),
  40
).chain((data) =>
  size.chain((s) => emphasis.map((e) => ({ data, ...e, ...s })))
);

const NOT_A_NUMBER = /NaN|Infinity/u;

/** Render and check; the props are whatever the generator made. */
const holds = <P extends object>(
  Chart: ComponentType<P>,
  payloads: Arbitrary<P>
) => {
  assert(
    property(payloads, (props) => {
      const html = renderToString(createElement(Chart, props));
      return !NOT_A_NUMBER.test(html);
    }),
    { numRuns: 400, seed: 20_261_101 }
  );
};

describe("a server render survives any payload and prints no NaN or Infinity", () => {
  it("RungBars", () => {
    expect(() => {
      holds(RungBars, rungBars);
    }).not.toThrow();
  });

  it("DumbbellQueue", () => {
    expect(() => {
      holds(DumbbellQueue, dumbbellQueue);
    }).not.toThrow();
  });

  it("PlumbScatter", () => {
    expect(() => {
      holds(PlumbScatter, plumbScatter);
    }).not.toThrow();
  });

  it("Slope", () => {
    expect(() => {
      holds(Slope, slope);
    }).not.toThrow();
  });

  it("HairlineLine", () => {
    expect(() => {
      holds(HairlineLine, daily);
    }).not.toThrow();
  });

  it("HairlineArea", () => {
    expect(() => {
      holds(HairlineArea, daily);
    }).not.toThrow();
  });
});

describe("counterexamples the generators found", () => {
  const sized = { height: 120, width: 90 };

  it("RungBars with a value of a trillion draws a capped count of rungs", () => {
    const html = renderToString(
      createElement(RungBars, {
        data: [{ label: "Huge", value: 1e12 }],
        ...sized,
      })
    );
    expect(html).toContain("</svg>");
    expect(html).not.toMatch(NOT_A_NUMBER);
  });

  it("DumbbellQueue narrower than its labels keeps a track of no length, not NaN", () => {
    const html = renderToString(
      createElement(DumbbellQueue, {
        data: [
          { after: 0, before: 94, label: "Oak" },
          { after: 3e-97, before: 0, label: "Ash" },
        ],
        ...sized,
      })
    );
    expect(html).not.toMatch(NOT_A_NUMBER);
  });

  it("HairlineLine over a range too narrow for d3 to count draws it flat", () => {
    const html = renderToString(
      createElement(HairlineLine, {
        data: [
          { date: "2024-03-02", value: 0 },
          { date: "2024-03-04", value: 1.5e-323 },
        ],
        ...sized,
      })
    );
    expect(html).toContain("</svg>");
    expect(html).not.toMatch(NOT_A_NUMBER);
  });
});
