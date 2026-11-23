// A view link carries its render input, and reading it back gives the same
// input as a document, or a problem when the link is damaged.
import { getChart } from "@howells/hairline/schema";
import { describe, expect, it } from "vitest";

import { drawChart, renderInputSchema } from "../src/mastra/tools/charts";
import { readView } from "../src/mastra/view";
import { viewUrl } from "../src/mastra/view-link";

const chart = getChart("rung-bars");

if (chart === undefined) {
  throw new Error("rung-bars is not registered");
}

const input = renderInputSchema(chart).parse({
  payload: { data: [{ label: "Mars", value: 2 }] },
  width: 600,
});

describe("view links", () => {
  it("round-trips the input as a document", async () => {
    const url = await viewUrl("rung-bars", input, "https://hairline.test");

    expect(url).toMatch(/^https:\/\/hairline\.test\/view\/rung-bars\//u);

    const token = new URL(url ?? "").pathname.split("/").at(-1) ?? "";
    const view = await readView("rung-bars", token);

    expect(view).toMatchObject({ input: { ...input, format: "document" } });
  });

  it("returns a problem for a damaged link", async () => {
    const view = await readView("rung-bars", "not-a-link");

    expect(view).toMatchObject({ problem: { status: 422 } });
  });

  it("returns a problem for an unknown kind", async () => {
    const view = await readView("pie", "x");

    expect(view).toMatchObject({ problem: { status: 404 } });
  });

  it("omits the link when the data is too large for one", async () => {
    const big = renderInputSchema(chart).parse({
      payload: {
        data: Array.from({ length: 24 }, () => ({
          label: Array.from({ length: 12 }, () => crypto.randomUUID()).join(
            " "
          ),
          value: Math.random(),
        })),
      },
    });

    await expect(
      viewUrl("rung-bars", big, "https://hairline.test")
    ).resolves.toBeUndefined();
  });
});

describe("drawn width", () => {
  it("fits its container, up to the width asked for", async () => {
    const drawn = await drawChart(chart, { ...input, format: "fragment" });

    expect(drawn.format).toBe("fragment");
    expect("html" in drawn && drawn.html).toContain("max-width:600px");
    expect(drawn.url).toBeDefined();
  });
});
