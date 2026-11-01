interface DataTableProps {
  /** Column headings; every row has one cell per heading. */
  columns: string[];
  /** Names the table for screen readers. */
  caption: string;
  rows: string[][];
  /** Show the table to sighted readers. Otherwise it is visually hidden. */
  visible?: boolean;
}

/**
 * The chart's data as a table, made from the same validated payload as the
 * marks. Every chart that adopts the accessible-data mechanism renders one
 * through `Plot`'s `table` prop, so it is in the first server HTML. Hidden
 * with `sr-only` it still reads out; `visible` is the opt-in table view.
 */
export const DataTable = (props: DataTableProps) => (
  <table
    className={
      props.visible === true
        ? "text-small mt-3 w-full border-collapse text-left tabular-nums"
        : "sr-only"
    }
  >
    <caption className={props.visible === true ? "sr-only" : undefined}>
      {props.caption}
    </caption>
    <thead>
      <tr>
        {props.columns.map((name) => (
          <th key={name} scope="col">
            {name}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {props.rows.map((row, r) => (
        // oxlint-disable-next-line react/no-array-index-key -- rows are positional and have no identity beyond their place
        <tr key={r}>
          {row.map((cell, c) => (
            // oxlint-disable-next-line react/no-array-index-key -- cells are positional
            <td key={c}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
