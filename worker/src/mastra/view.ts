// Reads a view link (see view-link.ts) back into a render input, validated
// again against the chart's schema, since anyone can write a link.
import { getChart } from "@howells/hairline/schema";
import type { ChartEntry } from "@howells/hairline/schema";

import { problem } from "./problem";
import type { Problem } from "./problem";
import { renderInputSchema } from "./tools/charts";
import type { RenderInput } from "./tools/charts";
import { unpackView } from "./view-link";

const badLink = (detail: string) => ({
  problem: problem("invalid-input", {
    detail,
    is_retriable: false,
    suggestions: ["Draw the chart again with render-chart for a fresh link."],
  }),
});

const parseJson = (
  text: string
): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

/** A view link's chart and render input (always a document), or the problem with it. */
export const readView = async (
  kind: string,
  token: string
): Promise<
  { chart: ChartEntry; input: RenderInput } | { problem: Problem }
> => {
  const chart = getChart(kind);

  if (chart === undefined) {
    return {
      problem: problem("chart-not-found", {
        detail: `No chart of kind "${kind}".`,
        is_retriable: false,
        suggestions: ["Call list-charts for the kinds."],
      }),
    };
  }

  const text = await unpackView(token).catch(() => null);

  if (text === null) {
    return badLink("The link is damaged: its chart data cannot be read.");
  }

  const json = parseJson(text);

  if (!json.ok) {
    return badLink("The link is damaged: its chart data is not JSON.");
  }

  const parsed = renderInputSchema(chart).safeParse(json.value);

  return parsed.success
    ? { chart, input: { ...parsed.data, format: "document" } }
    : badLink("The link's chart data no longer matches the chart's schema.");
};
