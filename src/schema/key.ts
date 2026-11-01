// React-free. The one way a datum is addressed: by its `id`, else by what
// names it (`label`, `name` or `date`), never by index.

/** A datum that can be addressed by key. */
export type Keyed = { id?: string } & (
  | { date: string }
  | { label: string }
  | { name: string }
);

/** The key a datum is addressed by: `id`, else its label, name or date. */
export const keyOf = (datum: Keyed): string => {
  if (datum.id !== undefined) {
    return datum.id;
  }
  if ("label" in datum) {
    return datum.label;
  }
  return "name" in datum ? datum.name : datum.date;
};
