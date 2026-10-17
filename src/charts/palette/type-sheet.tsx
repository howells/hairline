import { Plot } from "../core";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import type { Voice } from "../text";
import { cx, stagger } from "../util";

interface TypeRow {
  /** Room the row takes, in px: the figure needs more than the rest. */
  height: number;
  label: string;
  /** A chart role, or the page's own text at its two weights. */
  role: Voice | "page" | "wordmark";
  size: string;
  specimen: string;
  weight: string;
}

/** The case, top to bottom: the four chart roles, then the page's two. */
const ROWS: TypeRow[] = [
  {
    height: 44,
    label: "Axis",
    role: "axis",
    size: "11",
    specimen: "Jan 2024",
    weight: "Regular",
  },
  {
    height: 44,
    label: "Label",
    role: "label",
    size: "11",
    specimen: "East Midlands",
    weight: "Medium",
  },
  {
    height: 44,
    label: "Value",
    role: "value",
    size: "11",
    specimen: "4,612 GWh",
    weight: "Semibold",
  },
  {
    height: 64,
    label: "Figure",
    role: "figure",
    size: "30",
    specimen: "421 GWh",
    weight: "Semibold",
  },
  {
    height: 44,
    label: "Page",
    role: "page",
    size: "13.5",
    specimen: "Major earthquakes",
    weight: "Regular",
  },
  {
    height: 44,
    label: "Wordmark",
    role: "wordmark",
    size: "13.5",
    specimen: "Hairline",
    weight: "Semibold",
  },
];

/** A row's specimen, set in the role it shows. */
const Specimen = (p: {
  children: string;
  role: TypeRow["role"];
  x: number;
  y: number;
}) =>
  p.role === "page" || p.role === "wordmark" ? (
    <text
      className={cx(
        "text-small fill-text",
        p.role === "wordmark" && "font-semibold"
      )}
      dy="0.34em"
      x={p.x}
      y={p.y}
    >
      {p.children}
    </text>
  ) : (
    <Label middle voice={p.role} x={p.x} y={p.y}>
      {p.children}
    </Label>
  );

/** Room above the first row, for the column names. */
const HEAD = 28;

interface Columns {
  left: number;
  size: number;
  specimen: number;
  weight: number;
}

/**
 * Row names, specimens wide enough for the figure, then size and weight;
 * centred in the cell, a little tighter on a phone.
 */
const columnsFor = (width: number): Columns => {
  const narrow = width < 560;
  const name = narrow ? 76 : 136;
  const specimen = narrow ? 150 : 200;
  const size = narrow ? 44 : 64;
  const weight = 64;
  return {
    left: Math.max(
      0,
      Math.round((width - name - specimen - size - weight) / 2)
    ),
    size: name + specimen,
    specimen: name,
    weight: name + specimen + size,
  };
};

/**
 * The type sheet: every text role the library sets, in its own role, with
 * its size and weight. The case lives in src/system/app.css; this draws it.
 */
export const TypeSheet = () => (
  <Plot>
    {(width) => {
      const c = columnsFor(width);
      const height = HEAD + ROWS.reduce((n, r) => n + r.height, 0);
      let y = HEAD;
      return (
        <ChartSvg
          height={height}
          label="The type roles every chart may use"
          title="Type"
          width={width}
        >
          <g transform={`translate(${c.left} 0)`}>
            <Label muted voice="axis" x={c.size} y={12}>
              Size
            </Label>
            <Label muted voice="axis" x={c.weight} y={12}>
              Weight
            </Label>
            {ROWS.map((row, i) => {
              const mid = Math.round(y + row.height / 2);
              y += row.height;
              return (
                <g className="fade" key={row.label} style={stagger(i, "fine")}>
                  <Label middle muted voice="label" x={0} y={mid}>
                    {row.label}
                  </Label>
                  <Specimen role={row.role} x={c.specimen} y={mid}>
                    {row.specimen}
                  </Specimen>
                  <Label middle voice="value" x={c.size} y={mid}>
                    {row.size}
                  </Label>
                  <Label middle muted voice="axis" x={c.weight} y={mid}>
                    {row.weight}
                  </Label>
                </g>
              );
            })}
          </g>
        </ChartSvg>
      );
    }}
  </Plot>
);
