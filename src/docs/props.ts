// React-free. The props table, read off a chart's zod schema through its JSON
// Schema (the same input side the build writes to lib/json-schema), so the
// table can never drift from what the chart validates. A prop the schema adds
// appears here without an edit.
import { z } from "zod";

export interface PropRow {
  /** From the schema's own description, or the shared notes below. */
  description: string | undefined;
  deprecated: boolean;
  name: string;
  required: boolean;
  /** The type in TypeScript's words, with array items spelled out. */
  type: string;
}

interface Node {
  anyOf?: Node[];
  deprecated?: boolean;
  description?: string;
  enum?: unknown[];
  items?: Node | false;
  prefixItems?: Node[];
  properties?: Record<string, Node>;
  required?: string[];
  type?: string | string[];
}

const NodeSchema: z.ZodType<Node> = z.lazy(() =>
  z.looseObject({
    anyOf: z.array(NodeSchema).optional(),
    deprecated: z.boolean().optional(),
    description: z.string().optional(),
    enum: z.array(z.unknown()).optional(),
    items: z.union([NodeSchema, z.literal(false)]).optional(),
    prefixItems: z.array(NodeSchema).optional(),
    properties: z.record(z.string(), NodeSchema).optional(),
    required: z.array(z.string()).optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
  })
);

const SCALARS = new Map([
  ["integer", "number"],
  ["number", "number"],
]);

type Recur = (node: Node, expandObject: boolean) => string;

/** `{ label: string; id?: string }`, required fields first. */
const objectType = (node: Node, recur: Recur) => {
  const properties = node.properties ?? {};
  const required = new Set(node.required);
  const names = Object.keys(properties);
  const ordered = [
    ...names.filter((name) => required.has(name)),
    ...names.filter((name) => !required.has(name)),
  ];
  const fields = ordered.map(
    (name) =>
      `${name}${required.has(name) ? "" : "?"}: ${recur(properties[name] ?? {}, false)}`
  );
  return `{ ${fields.join("; ")} }`;
};

const arrayType = (node: Node, recur: Recur) => {
  if (node.prefixItems !== undefined) {
    return `[${node.prefixItems.map((item) => recur(item, false)).join(", ")}]`;
  }
  if (node.items === undefined || node.items === false) {
    return "unknown[]";
  }
  const inner = recur(node.items, true);
  const isUnion =
    node.items.anyOf !== undefined || node.items.enum !== undefined;
  return isUnion ? `(${inner})[]` : `${inner}[]`;
};

const singleType = (
  type: string,
  node: Node,
  expandObject: boolean,
  recur: Recur
) => {
  if (type === "array") {
    return arrayType(node, recur);
  }
  if (type === "object") {
    return expandObject && node.properties !== undefined
      ? objectType(node, recur)
      : "object";
  }
  return SCALARS.get(type) ?? type;
};

/** The shape of a node's type. Objects open out only as the items of an array. */
const typeOf = (node: Node, expandObject: boolean): string => {
  if (node.enum !== undefined) {
    return node.enum.map((value) => JSON.stringify(value)).join(" | ");
  }
  if (node.anyOf !== undefined) {
    return node.anyOf.map((option) => typeOf(option, expandObject)).join(" | ");
  }
  // A nullable scalar arrives as ["number", "null"].
  const types = Array.isArray(node.type) ? node.type : [node.type ?? "unknown"];
  return types
    .map((type) => singleType(type, node, expandObject, typeOf))
    .join(" | ");
};

/**
 * One line each for the options the charts share. The schemas keep their
 * notes as source comments, which a JSON Schema cannot carry; a description
 * set on a schema (`.describe()`) wins over these.
 */
export const SHARED_NOTES = {
  animate:
    'When the entry draws in: "scroll" as the chart scrolls into view, "mount" at once, "off" never (drawn, and ready, in the first HTML). The default is "off" for a fixed-size chart and "scroll" for a responsive one.',
  data: "The values to draw. Required; the package never falls back to demo data.",
  emphasis:
    "The datum to draw in the hero colour, by its id (else its label or date).",
  fit: "Fill the container's width at the chart's aspect ratio. Wins over scale.",
  format:
    'How values print: "integer", "decimal", "compact", "percent", or Intl number-format options. A function also works from TypeScript.',
  height: "Fixed height in px.",
  idPrefix:
    "Leads every SVG id, to separate charts rendered in separate React roots on one page.",
  initialWidth:
    "Responsive mode only: the width of the first render, before measuring.",
  metrics:
    "Glyph widths of a face other than Inter, so notes wrap and reserve room for it.",
  replayKey: "Change it to replay the entry without remounting the chart.",
  scale:
    "Slides: draw at the logical width, then show the composition this many times larger, type and textures with it.",
  strokes:
    '"proportional" (default) scales strokes with the composition; "device" keeps every stroke at one device pixel. It acts on stroked geometry only (rules, lines, rings, outlines): filled marks, such as the bars of RungBars, scale either way.',
  table:
    "Show the data table to sighted readers too. It is always there for screen readers.",
  title: "The chart's accessible name.",
  unitNote: "The in-plot key under the axis.",
  width: "Fixed width in px. Giving it turns measuring off.",
};

const noteFor = (name: string) =>
  Object.entries(SHARED_NOTES).find(([key]) => key === name)?.[1];

const ObjectNode = z.looseObject({
  properties: z.record(z.string(), NodeSchema),
  required: z.array(z.string()).optional(),
});

/** Every property of a chart's schema, required ones first, then by name. */
export const propsOf = (schema: z.ZodType): PropRow[] => {
  const root = ObjectNode.parse(z.toJSONSchema(schema, { io: "input" }));
  const required = new Set(root.required);
  return Object.entries(root.properties)
    .map(([name, node]) => ({
      deprecated: node.deprecated === true,
      description: node.description ?? noteFor(name),
      name,
      required: required.has(name),
      type: typeOf(node, false),
    }))
    .toSorted(
      (a, b) =>
        Number(b.required) - Number(a.required) || a.name.localeCompare(b.name)
    );
};
