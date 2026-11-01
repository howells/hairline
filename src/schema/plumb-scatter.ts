// React-free. PlumbScatter (F8 Stem scatter) follows the contract RungBars set
// (see ./rung-bars): one zod schema is the source of truth, types are
// inferred from it, formatters are descriptors, and points are addressed by
// key (`id`, else `label`), never by index. The registry lists it as a
// correlation chart.
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";

/** One point: a name, where it sits, and an optional key for when names repeat. */
export const plumbDatumSchema = z.strictObject({
  /** Names the point, and is its key unless `id` is given. */
  id: z.string().min(1).optional(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
});

/** The key a point is addressed by: `id`, else `label`. */
export const plumbKeyOf = (datum: { id?: string; label: string }) =>
  datum.id ?? datum.label;

const domainSchema = z.tuple([z.number(), z.number()]);

export const plumbScatterSchema = z
  .strictObject({
    data: z.array(plumbDatumSchema).min(1).max(20),
    /** The point to draw in the hero colour, by key. Defaults to the highest. */
    emphasis: z.string().optional(),
    /** How y prints: a preset name or Intl number-format options. */
    format: formatSchema.optional(),
    /** How x prints. Defaults to a rounded integer. */
    formatX: formatSchema.optional(),
    /** Fixed height in px. Without it a scatter is 440 tall. */
    height: z.number().int().positive().optional(),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z.number().int().positive().optional(),
    /** Points to name beside their dot, by key. Defaults to the highest and lowest. */
    labelled: z.array(z.string()).optional(),
    // The old name for `unitNote`; JSON Schema marks it deprecated.
    note: z.string().optional().meta({ deprecated: true }),
    /** The in-plot key under the axis. */
    unitNote: z.string().optional(),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z.number().int().positive().optional(),
    /** The x axis range, [low, high]. */
    xDomain: domainSchema.optional(),
    /** Names for the low and high ends of the x axis. */
    xLabels: z.tuple([z.string(), z.string()]).optional(),
    /** The y axis range, [low, high]. */
    yDomain: domainSchema.optional(),
    /** Name for the y direction, drawn up the left side. */
    yLabel: z.string().optional(),
  })
  .superRefine((props, ctx) => {
    const keys = new Set(props.data.map(plumbKeyOf));
    if (props.emphasis !== undefined && !keys.has(props.emphasis)) {
      ctx.addIssue({
        code: "custom",
        message: "emphasis names no point: it must equal a datum's id or label",
        path: ["emphasis"],
      });
    }
    for (const [i, key] of (props.labelled ?? []).entries()) {
      if (!keys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message:
            "labelled names no point: it must equal a datum's id or label",
          path: ["labelled", i],
        });
      }
    }
    for (const name of ["xDomain", "yDomain"] as const) {
      const domain = props[name];
      if (domain !== undefined && !(domain[0] < domain[1])) {
        ctx.addIssue({
          code: "custom",
          message: `${name} must run from low to high`,
          path: [name],
        });
      }
    }
  });

/** One point. */
export type PlumbDatum = z.infer<typeof plumbDatumSchema>;
/** The validated payload. */
export type PlumbScatterData = z.infer<typeof plumbScatterSchema>;
/** What `<PlumbScatter>` takes: the payload, with formats also allowed as functions. */
export type PlumbScatterProps = Omit<
  z.input<typeof plumbScatterSchema>,
  "format" | "formatX" | "note"
> & {
  format?: FormatInput;
  formatX?: FormatInput;
  /** @deprecated Use `unitNote`. */
  note?: string;
};
