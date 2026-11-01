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
 * Keys from the data: the text itself, numbered when it repeats, so two equal
 * rows or headings still get distinct, stable keys.
 */
const keyed = (texts: readonly string[]) => {
  const seen = new Map<string, number>();
  return texts.map((text) => {
    const count = (seen.get(text) ?? 0) + 1;
    seen.set(text, count);
    return { key: `${text}#${count}`, text };
  });
};

/**
 * The chart's data as a table, made from the same validated payload as the
 * marks. Every chart that adopts the accessible-data mechanism renders one
 * through `Plot`'s `table` prop, so it is in the first server HTML. Hidden
 * with `sr-only` it still reads out; `visible` is the opt-in table view.
 */
export const DataTable = (props: DataTableProps) => {
  const columns = keyed(props.columns);
  const rows = keyed(props.rows.map((row) => row.join("\u001F")));
  return (
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
          {columns.map(({ key, text }) => (
            <th key={key} scope="col">
              {text}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ key }, r) => (
          <tr key={key}>
            {keyed(props.rows[r] ?? []).map((cell) => (
              <td key={cell.key}>{cell.text}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
