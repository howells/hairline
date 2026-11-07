import { readFileSync } from "node:fs";

// Notes on the daily charts, and the halo under every label, through the
// built package, rendered on the server.
import { HairlineArea, HairlineLine } from "@howells/hairline";
import type {
  DailyDatum,
  HairlineAreaProps,
  HairlineLineProps,
} from "@howells/hairline";
import { getChart } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const week: DailyDatum[] = [
  { date: "2024-03-04", value: 10 },
  { date: "2024-03-05", value: 14 },
  { date: "2024-03-06", value: 9 },
  { date: "2024-03-07", value: 12 },
  { date: "2024-03-08", value: 11 },
  { date: "2024-03-09", value: 8 },
  { date: "2024-03-10", value: 13 },
];

const notes = [
  { at: "2024-03-05", detail: "Orders dip", title: "Price change" },
  { at: "2024-03-09", title: "Showroom opens" },
];

const wide = { data: week, height: 320, width: 640 };
const narrow = { data: week, height: 320, width: 360 };

type Props = Partial<HairlineAreaProps & HairlineLineProps>;

const line = (props: Props) =>
  renderToString(createElement(HairlineLine, { ...wide, ...props }));

const area = (props: Props) =>
  renderToString(createElement(HairlineArea, { ...wide, ...props }));

describe.each([
  ["HairlineLine", line, "hairline-line"],
  ["HairlineArea", area, "hairline-area"],
] as const)("%s notes", (_name, render, kind) => {
  it("draws nothing extra without notes", () => {
    const html = render({});
    expect(html).not.toContain("Price change");
    expect(html).not.toContain("<ol");
  });

  it("wide: each note's words sit on the chart, with no list under it", () => {
    const html = render({ notes });
    expect(html).toContain("Price change");
    expect(html).toContain("Orders dip");
    expect(html).toContain("Showroom opens");
    expect(html).not.toContain("<ol");
  });

  it("narrow: numbered discs on the chart and the words listed under it", () => {
    const html = render({ ...narrow, notes });
    expect(html).toContain("<ol");
    expect(html.match(/<li[ >]/gu)).toHaveLength(2);
    // The words are in the list, not drawn in the svg.
    const svg = /<svg[\s\S]*<\/svg>/u.exec(html)?.[0] ?? "";
    expect(svg).not.toContain(">Price change</text>");
    expect(svg).toContain(">1</text>");
    expect(svg).toContain(">2</text>");
  });

  it("the data table gains a Note column carrying the words", () => {
    const html = render({ notes });
    expect(html).toContain("<th");
    expect(html).toContain(">Note<");
    expect(html).toContain("Price change. Orders dip");
  });

  it("the table has no Note column without notes", () => {
    expect(render({})).not.toContain(">Note<");
  });

  it("the aria description lists the notes", () => {
    const html = render({ notes });
    expect(html).toContain("Notes: Price change. Orders dip, on");
  });

  it("a note naming a gap or no reading is left out", () => {
    const html = render({
      data: [...week.slice(0, 3), { date: "2024-03-07", value: null }],
      notes: [{ at: "2024-03-07", title: "On a gap" }],
    });

    expect(html).not.toContain("On a gap");
  });

  it("validation rejects a note that names no datum", () => {
    const checked = getChart(kind).validate({
      data: week,
      notes: [{ at: "2030-01-01", title: "Nowhere" }],
    });

    expect(checked.ok).toBe(false);
    expect(checked.ok ? [] : checked.issues.map((i) => i.pointer)).toContain(
      "notes"
    );
  });

  it("validation takes notes that name a datum", () => {
    expect(getChart(kind).validate({ data: week, notes }).ok).toBe(true);
  });
});

describe("the paper halo", () => {
  it("is on every label by default, so lines stop short of the text", () => {
    const html = line({});
    const labels = html.match(/<text[^>]*>/gu) ?? [];
    expect(labels.length).toBeGreaterThan(5);
    expect(labels.every((t) => t.includes("t-halo"))).toBe(true);
  });

  it("is a 5px paper stroke painted first: a 2.5px gap round every glyph", () => {
    const css = readFileSync("src/system/hairline.css", "utf-8");
    const rule = /@utility t-halo \{(?<body>[^}]*)\}/u.exec(css)?.groups?.body;
    expect(rule).toContain("paint-order: stroke");
    expect(rule).toContain("stroke: var(--hl-paper)");
    expect(rule).toContain("stroke-width: 5px");
  });
});
