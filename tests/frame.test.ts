// Seam 1 again, for the host-owned frame: charts draw only the plot, the host
// composes name, source and notes (optionally with Frame), and the in-plot
// unit note is `unitNote` with `note` kept as a deprecated alias.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { RungBars } from "@howells/hairline";
import { Frame } from "@howells/hairline/frame";
import type { FrameProps } from "@howells/hairline/frame";
import { getChart } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const read = (root: string, f: string) =>
  readFileSync(path.join(root, f), "utf-8");

const bars = [
  { label: "2021", value: 19 },
  { label: "2022", value: 11 },
];
const sized = { height: 320, width: 480 };

const chart = createElement(RungBars, { data: bars, ...sized });
const framed = (props: Omit<FrameProps, "children">) =>
  // oxlint-disable-next-line react/no-children-prop -- createElement's children argument does not satisfy the required prop
  renderToString(createElement(Frame, { ...props, children: chart }));
const at = (html: string, text: string) => html.indexOf(text);

describe("Frame lays out name, source, footnote and note round a chart", () => {
  const html = framed({
    footnote: "Counts to the end of June.",
    name: "Quakes by year",
    note: "Every quake above magnitude 4.",
    source: "British Geological Survey",
  });

  it("names the figure and shows the name in its caption", () => {
    expect(html).toContain('aria-label="Quakes by year"');
    expect(html).toMatch(/<figcaption[^>]*>[\s\S]*Quakes by year/u);
  });

  it("shows the source, the footnote and the info note", () => {
    expect(html).toContain("British Geological Survey");
    expect(html).toContain("Counts to the end of June.");
    expect(html).toContain("Every quake above magnitude 4.");
    expect(html).toContain('aria-label="About Quakes by year"');
  });

  it("holds the chart between the name and the source line", () => {
    const caption = at(html, "</figcaption>");
    const plot = html.indexOf("<svg", caption);
    expect(plot).toBeGreaterThan(caption);
    expect(at(html, "<footer")).toBeGreaterThan(plot);
    expect(at(html, "British Geological Survey")).toBeGreaterThan(
      at(html, "<footer")
    );
    expect(at(html, "Counts to the end of June.")).toBeGreaterThan(
      at(html, "British Geological Survey")
    );
  });

  it("leaves out what it is not given", () => {
    const bare = framed({ name: "Quakes by year" });
    expect(bare).not.toContain("About Quakes by year");
    expect(bare).not.toContain("<footer");
    expect(bare).toContain("<svg");
  });
});

const unitNoteText = (props: { note?: string; unitNote?: string }) =>
  renderToString(createElement(RungBars, { data: bars, ...sized, ...props }));

describe("the in-plot note is unitNote", () => {
  it("unitNote draws the note", () => {
    expect(unitNoteText({ unitNote: "One rung = 1 quake" })).toContain(
      ">One rung = 1 quake<"
    );
  });

  it("the old note prop still draws it", () => {
    expect(unitNoteText({ note: "One rung = 1 quake" })).toContain(
      ">One rung = 1 quake<"
    );
  });

  it("unitNote wins when both are given", () => {
    const html = unitNoteText({ note: "old", unitNote: "new" });
    expect(html).toContain(">new<");
    expect(html).not.toContain(">old<");
  });

  it("the schema and its JSON Schema carry both, the old one deprecated", () => {
    const ok = getChart("rung-bars").validate({
      data: bars,
      unitNote: "n",
    });
    expect(ok.ok).toBe(true);
    const json = z
      .object({
        properties: z.record(
          z.string(),
          z.object({ deprecated: z.boolean().optional() })
        ),
      })
      .parse(
        JSON.parse(
          readFileSync(
            new URL("../lib/json-schema/rung-bars.json", import.meta.url),
            "utf-8"
          )
        )
      );
    expect(json.properties.unitNote).toBeDefined();
    expect(json.properties.unitNote.deprecated).toBeUndefined();
    expect(json.properties.note.deprecated).toBe(true);
  });

  it("every chart's props take unitNote, with note marked deprecated", () => {
    const root = new URL("../lib/types/charts/", import.meta.url).pathname;
    const withNote = readdirSync(root, { encoding: "utf-8", recursive: true })
      .filter((f) => f.endsWith(".d.ts"))
      // The map base is internal: its two wrappers are the charts.
      .filter(
        (f) => !["choropleth.d.ts", "util.d.ts"].includes(path.basename(f))
      )
      .filter((f) => /^\s*note\?: string;/mu.test(read(root, f)));
    expect(withNote.length).toBeGreaterThan(40);
    const lacking = withNote.filter(
      (f) =>
        !/@deprecated[^/]*\*\/\s*note\?: string;/u.test(read(root, f)) ||
        !/^\s*unitNote\?: string;/mu.test(read(root, f))
    );
    expect(lacking).toStrictEqual([]);
  });
});

describe("no chart takes a title or a source", () => {
  it("the schema rejects both", () => {
    const checked = getChart("rung-bars").validate({
      data: bars,
      source: "x",
      title: "y",
    });
    expect(checked.ok).toBe(false);
  });

  it("no chart's props declare either", () => {
    const root = new URL("../lib/types/charts/", import.meta.url).pathname;
    const files = readdirSync(root, {
      encoding: "utf-8",
      recursive: true,
    }).filter(
      (f) =>
        f.endsWith(".d.ts") &&
        !f.includes(".data.") &&
        !f.startsWith("board") &&
        !["frame.d.ts", "svg.d.ts"].includes(path.basename(f))
    );
    const offenders = files.filter((f) =>
      /^\s*(?:title|source)\??:/mu.test(
        readFileSync(path.join(root, f), "utf-8")
      )
    );
    expect(offenders).toStrictEqual([]);
  });
});
