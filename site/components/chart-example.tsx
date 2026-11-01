// A chart page's live example, drawn by the package the way a consumer draws
// it: hairline.css for the styles, a .hl-root for the tokens (the site's
// stylesheet sets them from deriveTheme, per mode), and the payload checked
// against the chart's schema on the way in. components.ts hydrates it on
// load: the server draws at WIDTH, and the chart then measures its column.
// Animation is off, so the server HTML is the drawn chart: a plot that waits
// to be revealed stays blank to a reader without script, to a capture taken
// before the entry runs, and to anything that reads the HTML. Without script a
// column narrower than WIDTH scrolls the figure rather than clipping it.
import "@howells/hairline/hairline.css";
import { drawers } from "@howells/hairline/draw";
import type { ChartKind } from "@howells/hairline/schema";

import { exampleFor } from "../src/examples";

/** The prose column at 1440, so the first render is the settled one there. */
const WIDTH = 672;

interface ChartExampleProps {
  kind: ChartKind;
}

const ChartExample = (props: ChartExampleProps) => (
  <figure className="hl-root not-prose my-8 overflow-x-auto">
    {drawers[props.kind](exampleFor(props.kind), {
      animate: "off",
      initialWidth: WIDTH,
    })}
  </figure>
);

export default ChartExample;
