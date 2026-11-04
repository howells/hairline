import { describe, expect, it } from "vitest";

import { fitBandLabels, headerLines } from "../src/charts/band-labels";

/** Every character 6px wide. */
const measure = (s: string) => s.length * 6;

describe("fitBandLabels: labels under narrow bands", () => {
  const years = Array.from({ length: 10 }, (_, i) => String(2016 + i));

  it("leaves labels that clear each other alone", () => {
    expect(fitBandLabels(years, { measure, room: 8, step: 40 })).toStrictEqual(
      years
    );
  });

  it("shortens a run of years after the first, never staggering them", () => {
    const shown = fitBandLabels(years, { measure, room: 8, step: 30 });
    expect(shown).toStrictEqual([
      "2016",
      "’17",
      "’18",
      "’19",
      "’20",
      "’21",
      "’22",
      "’23",
      "’24",
      "’25",
    ]);
  });

  it("thins words to every other band when even short they touch, keeping the hero", () => {
    const words = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const shown = fitBandLabels(words, {
      keep: [3],
      measure,
      room: 8,
      step: 40,
    });
    expect(shown[3]).toBe("Thursday");
    const printed = shown.filter((l) => l !== null);
    expect(printed.length).toBeLessThan(words.length);
    expect(shown[2]).toBeNull();
    expect(shown[4]).toBeNull();
  });
});

describe("headerLines: a header over its own column", () => {
  it("wraps at spaces", () => {
    expect(headerLines("Tumble dryer", 40, measure)).toStrictEqual([
      "Tumble",
      "dryer",
    ]);
  });

  it("breaks a period after its dash", () => {
    expect(headerLines("1996–2010", 40, measure)).toStrictEqual([
      "1996–",
      "2010",
    ]);
  });

  it("hyphenates a word too wide for the column, preferring a consonant pair", () => {
    expect(headerLines("Dishwasher", 40, measure)).toStrictEqual([
      "Dish-",
      "washer",
    ]);
  });

  it("keeps a header that fits on one line", () => {
    expect(headerLines("Car", 40, measure)).toStrictEqual(["Car"]);
  });
});
