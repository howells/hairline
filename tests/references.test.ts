// Seam 1: the reference marks and the interval marks, through the built
// package. Each behaviour renders on the server and reads the markup.
import {
  DumbbellQueue,
  HairlineArea,
  HairlineLine,
  PlumbScatter,
  RungBars,
} from "@howells/hairline";
import type { HairlineLineProps, RungBarsProps } from "@howells/hairline";
import { charts } from "@howells/hairline/schema";
import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const sized = { height: 360, width: 520 };
const render = (element: ReactElement) => renderToString(element);
const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;
const days = Array.from({ length: 10 }, (_, i) => ({
  date: `2024-03-${String(i + 1).padStart(2, "0")}`,
  value: 10 + i,
}));
const bars = [
  { label: "A", value: 10 },
  { label: "B", value: 20 },
  { label: "C", value: 30 },
];
const target = { emphasis: "above", label: "Target 20", value: 20 } as const;
const band = { from: 12, label: "Last year", to: 18 };

describe("references on every typed chart", () => {
  it("RungBars draws a dashed target with its label, a band behind the bars, and lists both", () => {
    const html = render(
      createElement(RungBars, {
        data: bars,
        references: [target, band],
        unit: 1,
        ...sized,
      })
    );
    expect(count(html, /dash-rule/gu)).toBe(1);
    expect(html).toContain("Target 20");
    expect(html).toContain("Last year");
    expect(html.indexOf("fill-l6")).toBeLessThan(html.indexOf("stroke-l5"));
  });

  it("RungBars lists its references in the data table and the description", () => {
    const html = render(
      createElement(RungBars, {
        data: bars,
        references: [target, band],
        unit: 1,
        ...sized,
      })
    );
    expect(html).toContain("Reference line: Target 20");
    expect(html).toContain("Reference band: Last year");
    expect(html).toContain("12 to 18");
    expect(html).toMatch(
      /<desc[^>]*>[^<]*Target 20, 20; readings at or above/u
    );
  });

  it("RungBars keeps the bars that clear the target in ink and steps the rest back", () => {
    const html = render(
      createElement(RungBars, { data: bars, references: [target], ...sized })
    );
    // B and C clear it (at or above 20); A falls short
    expect(html).toContain("fill-l5");
    const plain = render(createElement(RungBars, { data: bars, ...sized }));
    expect(count(html, /fill-hero/gu)).toBeGreaterThan(
      count(plain, /fill-hero/gu)
    );
    expect(plain).not.toContain("fill-l5");
  });

  it("a line without emphasis leaves every bar's own tone", () => {
    const html = render(
      createElement(RungBars, {
        data: bars,
        references: [{ label: "Target", value: 20 }],
        ...sized,
      })
    );
    expect(html).not.toContain("fill-l5");
  });

  it("the axis keeps room for a target above every bar", () => {
    const low = render(
      createElement(RungBars, {
        data: bars,
        references: [{ value: 60 }],
        unit: 1,
        ...sized,
      })
    );
    expect(count(low, /dash-rule/gu)).toBe(1);
  });

  it("HairlineLine and HairlineArea draw references and list them", () => {
    for (const Chart of [HairlineLine, HairlineArea]) {
      const html = render(
        createElement(Chart, {
          data: days,
          references: [{ label: "Target 15", value: 15 }, band],
          ...sized,
        })
      );
      expect(html).toContain("Target 15");
      expect(count(html, /dash-rule/gu)).toBe(1);
      expect(html).toContain("Reference band: Last year");
    }
  });

  it("DumbbellQueue draws an upright target across the rows", () => {
    const html = render(
      createElement(DumbbellQueue, {
        data: [
          { after: 9, before: 4, label: "Oak" },
          { after: 3, before: 7, label: "Ash" },
        ],
        references: [{ emphasis: "above", label: "Six", value: 6 }],
        ...sized,
      })
    );
    expect(html).toContain("Six");
    expect(html).toContain("fill-l5");
    expect(html).toContain("Reference line: Six");
  });

  it("PlumbScatter takes references on both axes", () => {
    const html = render(
      createElement(PlumbScatter, {
        data: [
          { label: "Oak", x: 1, y: 4 },
          { label: "Ash", x: 3, y: 2 },
        ],
        references: [{ label: "Y line", value: 3 }],
        xReferences: [{ from: 2, label: "X band", to: 4 }],
        ...sized,
      })
    );
    expect(html).toContain("Y line");
    expect(html).toContain("X band");
    expect(html).toContain("Reference line on y: Y line");
    expect(html).toContain("Reference band on x: X band");
  });

  it("a reference outside an explicit axis is not drawn but stays in the table", () => {
    const html = render(
      createElement(PlumbScatter, {
        data: [{ label: "Oak", x: 1, y: 4 }],
        references: [{ label: "Far off", value: 400 }],
        yDomain: [0, 10],
        ...sized,
      })
    );
    expect(html).toContain("Reference line on y: Far off");
    expect(count(html, /dash-rule/gu)).toBe(0);
  });
});

const checkReferences = (references: RungBarsProps["references"]) =>
  charts["rung-bars"].validate({ data: bars, references });

describe("the references schema", () => {
  it("accepts lines and bands", () => {
    expect(checkReferences([target, band]).ok).toBe(true);
  });

  it("rejects a band that runs backwards, and a seventh reference", () => {
    expect(checkReferences([{ from: 5, to: 2 }]).ok).toBe(false);
    expect(
      checkReferences(Array.from({ length: 7 }, (_, i) => ({ value: i }))).ok
    ).toBe(false);
  });
});

const covering = (coverage: number) => ({
  coverage,
  points: [{ date: "2024-03-02", high: 2, low: 1 }],
});
const checkIntervals = (intervals: HairlineLineProps["intervals"]) =>
  charts["hairline-line"].validate({ data: days, intervals }).ok;

describe("intervals and forecast", () => {
  const fan = [
    {
      coverage: 0.9,
      points: [
        { date: "2024-03-09", high: 19, low: 9 },
        { date: "2024-03-10", high: 22, low: 6 },
      ],
    },
    {
      coverage: 0.5,
      points: [
        { date: "2024-03-09", high: 18, low: 16 },
        { date: "2024-03-10", high: 20, low: 14 },
      ],
    },
  ];
  const drawn = (Chart: typeof HairlineArea | typeof HairlineLine) =>
    render(
      createElement(Chart, {
        data: days,
        forecast: { from: "2024-03-08" },
        intervals: fan,
        ...sized,
      })
    );

  it("names each band by its coverage in words, and draws solid ramp tones", () => {
    for (const Chart of [HairlineArea, HairlineLine]) {
      const html = drawn(Chart);
      expect(html).toContain("9 in 10 outcomes");
      expect(html).toContain(">Half<");
      expect(html).toContain("fill-l6");
      expect(html).toContain("fill-l5");
      expect(html).not.toMatch(/fill-opacity|opacity="/u);
    }
  });

  it("takes a label of the caller's own", () => {
    const html = render(
      createElement(HairlineArea, {
        data: days,
        intervals: [{ ...fan[0], label: "Likely range" }],
        ...sized,
      })
    );
    expect(html).toContain("Likely range");
    expect(html).not.toContain("9 in 10");
  });

  it("draws the forecast dashed after a Forecast rule", () => {
    for (const Chart of [HairlineArea, HairlineLine]) {
      const html = drawn(Chart);
      expect(html).toContain(">Forecast<");
      expect(count(html, /dash-rule/gu)).toBe(1);
    }
    const plain = render(createElement(HairlineArea, { data: days, ...sized }));
    expect(plain).not.toContain("Forecast");
  });

  it("lists the bands and the basis in the data table and the description", () => {
    const html = drawn(HairlineArea);
    expect(html).toContain("Half, low");
    expect(html).toContain("9 in 10 outcomes, high");
    expect(html).toContain(">Forecast</td>");
    expect(html).toContain(">Observed</td>");
    expect(html).toMatch(/<desc[^>]*>[^<]*Band: Half/u);
  });

  it("is the same markup every render: nothing jitters", () => {
    expect(drawn(HairlineArea)).toBe(drawn(HairlineArea));
  });

  it("the schema rejects a band day that is not a reading, and an upside-down edge", () => {
    const result = charts["hairline-area"].validate({
      data: days,
      intervals: [
        {
          coverage: 0.5,
          points: [
            { date: "2030-01-01", high: 2, low: 1 },
            { date: "2024-03-02", high: 1, low: 2 },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.issues.map((i) => i.pointer)).toStrictEqual([
      "intervals[0].points[0].date",
      "intervals[0].points[1].low",
    ]);
  });

  it("the schema allows two bands at most and coverage between 0 and 1", () => {
    expect(checkIntervals([covering(0.5), covering(0.9), covering(0.95)])).toBe(
      false
    );
    expect(checkIntervals([covering(1)])).toBe(false);
    expect(checkIntervals([covering(0.5)])).toBe(true);
  });
});

const plateOf = (values: number[]) => {
  const html = render(
    createElement(HairlineLine, {
      data: values.map((value, i) => ({
        date: `2024-03-${String(i + 1).padStart(2, "0")}`,
        value,
      })),
      height: 360,
      references: [{ from: 10, label: "Normal range", to: 20 }],
      width: 390,
    })
  );
  const at = html.indexOf(">Normal range<");
  const plate = html.slice(html.lastIndexOf("<rect", at), at);
  const read = (axis: "x" | "y") =>
    Number(new RegExp(` ${axis}="(?<n>[\\d.]+)"`, "u").exec(plate)?.groups?.n);
  return { left: read("x"), top: read("y") };
};

describe("a band's name", () => {
  it("sits at the end of the band the series is farther from", () => {
    const highAtStart = plateOf([19, 18, 17, 16, 15, 14, 14, 15, 16, 17]);
    const lowAtStart = plateOf([14, 15, 16, 17, 18, 19, 19, 18, 17, 16]);
    expect(highAtStart.left).toBeLessThan(195);
    expect(lowAtStart.left).toBeGreaterThan(195);
  });

  it("stays out of the series: below it when the line rides the top", () => {
    const { top } = plateOf([19, 19, 19, 19, 19, 19, 19, 19, 19, 19]);
    expect(top).toBeGreaterThan(180);
  });
});
