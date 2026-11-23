// Draws one chart from a payload, on the server, in the format the caller asked
// for. Pure: the same payload always gives the same output, and nothing is kept.
import { drawers } from "@howells/hairline/draw";
import type { ChartEntry, Payload } from "@howells/hairline/schema";
import { deriveTheme } from "@howells/hairline/theme";
import type { ThemeInput } from "@howells/hairline/theme";
import { createElement } from "react";
import { renderToString } from "react-dom/server.edge";

import { HAIRLINE_CSS } from "../generated/hairline-css";

export const THEMES = {
  dark: { ink: "#efe9de", mode: "dark", paper: "#161412" },
  light: { ink: "#1d1b18", mode: "light", paper: "#fbfbf9" },
} as const satisfies Record<string, ThemeInput>;

export type Format = "document" | "fragment" | "react";

export interface RenderRequest {
  chart: ChartEntry;
  format: Format;
  height: number;
  /** Already validated against the chart's schema by the tool's inputSchema. */
  payload: Payload;
  theme: ThemeInput;
  title?: string;
  width: number;
}

/** Where the Worker serves the stylesheet a fragment needs. */
export const STYLESHEET_PATH = "/hairline.css";

export type Rendered =
  | { format: "document"; html: string; ok: true }
  | { format: "fragment"; html: string; ok: true; stylesheet: string }
  | { code: string; format: "react"; install: string; ok: true };

const escapeHtml = (text: string) =>
  text.replace(/[&<>"]/g, (c) => `&${{ '"': "quot", "&": "amp", "<": "lt", ">": "gt" }[c]};`);

const markup = (request: RenderRequest) => {
  const chart = drawers[request.chart.kind as keyof typeof drawers](request.payload, {
    animate: "off",
    height: request.height,
    idPrefix: "hl",
    width: request.width,
  });

  return renderToString(
    createElement("div", { className: "hl-root", style: deriveTheme(request.theme) }, chart)
  );
};

const document = (request: RenderRequest, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(request.title ?? `Hairline ${request.chart.kind}`)}</title>
<style>${HAIRLINE_CSS}
body { margin: 0; padding: 24px; background: ${request.theme.paper}; font-family: ui-sans-serif, system-ui, sans-serif; }
</style>
</head>
<body>
${body}
</body>
</html>
`;

const react = (request: RenderRequest) => {
  const { component } = request.chart;
  const props = JSON.stringify(request.payload, null, 2);
  const theme = JSON.stringify(request.theme, null, 2);

  return `import { ${component} } from "@howells/hairline";
import { deriveTheme } from "@howells/hairline/theme";
import "@howells/hairline/hairline.css";

const payload = ${props};

export function Chart() {
  return (
    <div className="hl-root" style={deriveTheme(${theme})}>
      <${component} {...payload} />
    </div>
  );
}
`;
};

const INSTALL =
  "npm install @howells/hairline react react-dom. Import @howells/hairline/hairline.css once (or @howells/hairline/theme.css in a Tailwind v4 app). The chart fills its container's width; pass width and height to fix its size.";

export const render = (request: RenderRequest, origin: string): Rendered => {
  if (request.format === "react") {
    return { code: react(request), format: "react", install: INSTALL, ok: true };
  }

  const body = markup(request);

  return request.format === "document"
    ? { format: "document", html: document(request, body), ok: true }
    : { format: "fragment", html: body, ok: true, stylesheet: new URL(STYLESHEET_PATH, origin).href };
};
