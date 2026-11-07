import { useState } from "react";

import type { FacetPanel } from "../facet-layout";
import { Facets } from "../facets";
import type { Sync } from "../hooks";
import { MonthlyBars } from "./monthly-bars";
import { sparkGridDemo } from "./spark-grid.data";
import type { SparkBarCell, SparkCell, SparkLineCell } from "./spark-grid.data";
import { TimeLines } from "./time-lines";

interface SparkGridProps {
  /** The small multiples, read left to right. Defaults to the board's nine vitals. */
  cells?: SparkCell[];
  /** Plot height of every cell, px. */
  height?: number;
}

const isLineCell = (cell: SparkCell): cell is SparkLineCell =>
  cell.kind === "line" || cell.kind === "step";

interface CellProps {
  height: number;
  sync: Sync;
}

const BarCell = (props: CellProps & { cell: SparkBarCell }) => {
  const { cell } = props;

  return (
    <MonthlyBars
      height={props.height}
      sync={props.sync}
      compact
      label={cell.label}
      months={cell.months}
      stacks={[{ tone: "s1", values: cell.values }]}
      rest={cell.rest === undefined ? cell.values.length - 1 : cell.rest}
      plan={
        cell.kind === "plan" && cell.plan !== undefined
          ? { value: cell.plan }
          : undefined
      }
      diverging={cell.kind === "diverging"}
      y={{ domain: cell.domain }}
      format={cell.format}
    />
  );
};

const LineCell = (props: CellProps & { cell: SparkLineCell }) => {
  const { cell } = props;

  return (
    <TimeLines
      height={props.height}
      sync={props.sync}
      compact
      label={cell.label}
      series={[{ data: cell.data, format: cell.format, tone: cell.tone ?? 1 }]}
      rest={cell.rest ?? cell.data.length - 1}
      cursorAtRest={false}
      fill={cell.area === true ? "area" : undefined}
      step={cell.kind === "step"}
      threshold={cell.threshold}
      zero={cell.zero}
      y={{ domain: cell.domain }}
    />
  );
};

/** The value a cell's cursor rests on, printed; "None" where it is withheld. */
const restValue = (cell: SparkCell) => {
  const value = isLineCell(cell)
    ? cell.data[cell.rest ?? cell.data.length - 1].value
    : cell.values[cell.rest ?? cell.values.length - 1];

  return value === null || value === undefined ? "None" : cell.format(value);
};

const panelOf = (cell: SparkCell): FacetPanel => ({
  domain: cell.domain,
  key: `${cell.kind}-${cell.label}`,
  name: cell.title,
  value: restValue(cell),
});

/**
 * The board's vitals as small multiples sharing one cursor. They measure
 * different things in different units, so each is on its own scale and the
 * facets say so; the cells keep the domains they were given.
 */
export const SparkGrid = (props: SparkGridProps) => {
  const [time, setTime] = useState<number | null>(null);
  const sync: Sync = { setTime, time };
  const height = props.height ?? 76;
  const cells = props.cells ?? sparkGridDemo;

  return (
    <Facets
      hero={null}
      label="Vitals"
      minWidth={160}
      panels={cells.map(panelOf)}
      scale="free"
    >
      {({ index }) => {
        const cell = cells[index];

        return isLineCell(cell) ? (
          <LineCell cell={cell} height={height} sync={sync} />
        ) : (
          <BarCell cell={cell} height={height} sync={sync} />
        );
      }}
    </Facets>
  );
};
