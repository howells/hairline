import { useState } from "react";

import type { Sync } from "../hooks";
import { MonthlyBars } from "./monthly-bars";
import { sparkGridDemo } from "./spark-grid.data";
import type { SparkBarCell, SparkCell, SparkLineCell } from "./spark-grid.data";
import { TimeLines } from "./time-lines";

/** The grid is three by three; further cells are dropped. */
const MAX_CELLS = 9;

interface SparkGridProps {
  /** Up to nine small multiples, read left to right. Defaults to the board's nine vitals. */
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
      compact={{ title: cell.title }}
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
      compact={{ title: cell.title }}
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

/** Nine small multiples sharing one cursor. */
export const SparkGrid = (props: SparkGridProps) => {
  const [time, setTime] = useState<number | null>(null);
  const sync: Sync = { setTime, time };
  const height = props.height ?? 76;
  const cells = (props.cells ?? sparkGridDemo).slice(0, MAX_CELLS);

  return (
    <div className="grid grid-cols-3 gap-x-5 gap-y-4">
      {cells.map((cell) =>
        isLineCell(cell) ? (
          <LineCell
            key={`${cell.kind}-${cell.label}`}
            cell={cell}
            height={height}
            sync={sync}
          />
        ) : (
          <BarCell
            key={`${cell.kind}-${cell.label}`}
            cell={cell}
            height={height}
            sync={sync}
          />
        )
      )}
    </div>
  );
};
