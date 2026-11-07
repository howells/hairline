// The right-hand value scale and the value label by the latest data never
// print over one another: the scale's value gives way, its rule stays.
import { HairlineArea, HairlineLine } from "@howells/hairline";
import type { DailyDatum } from "@howells/hairline";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { hairlineLineDemo } from "../src/charts/basics/hairline-line.data";
import { labelBox, touches } from "../src/charts/label-box";

const dollars = (v: number) => `$${v.toFixed(2)}`;

/** The text of every `<text>` in the html. */
const texts = (html: string) =>
  [...html.matchAll(/<text[^>]*>(?<t>[^<]*)</gu)].map((m) => m.groups?.t ?? "");

const renderLine = () =>
  renderToString(
    createElement(HairlineLine, {
      data: hairlineLineDemo,
      extreme: "trough",
      format: dollars,
      height: 440,
      width: 1280,
    })
  );

describe("the line chart", () => {
  it("prints the latest value, and not the scale value it would sit on", () => {
    const all = texts(renderLine());
    // The latest day is $1.11; the $1.12 rule's value would touch its label.
    expect(all).toContain("$1.11");
    expect(all).not.toContain("$1.12");
  });

  it("keeps the other scale values", () => {
    const all = texts(renderLine());

    for (const v of ["$1.18", "$1.16", "$1.14", "$1.10", "$1.08"]) {
      expect(all).toContain(v);
    }
  });
});

describe("the area chart", () => {
  // Rising to a peak of 29 on the last day: its label sits level with the 30 tick.
  const data: DailyDatum[] = Array.from({ length: 10 }, (_, i) => ({
    date: `2024-03-${String(i + 1).padStart(2, "0")}`,
    value: i === 9 ? 29 : i * 2,
  }));

  const render = () =>
    renderToString(
      createElement(HairlineArea, {
        data,
        format: (v: number) => `${v} units`,
        height: 440,
        ticks: [0, 10, 20, 30],
        width: 640,
      })
    );

  it("drops the scale value that would sit under the hero's label", () => {
    const all = texts(render());
    expect(all).toContain("29 units");
    expect(all).not.toContain("30 units");
    expect(all).toContain("20 units");
  });
});

describe("label boxes", () => {
  it("touch when they overlap or come within the pad, not otherwise", () => {
    const a = labelBox("$1.11", 100, 50, "middle");
    expect(touches(a, labelBox("$1.12", 110, 52, "end"))).toBe(true);
    expect(touches(a, labelBox("$1.12", 400, 50, "end"))).toBe(false);
    expect(touches(a, labelBox("$1.12", 100, 90, "middle"))).toBe(false);
  });
});
