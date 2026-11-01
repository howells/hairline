// React-free. Formatter descriptors: how a chart prints a number, written as
// plain data so a prop can cross the server-to-client boundary and an agent
// can write it. Every chart that formats numbers takes `FormatInput` and
// calls `resolveFormat` once; TypeScript callers may still pass a function.
import { utcFormat } from "d3-time-format";
import { z } from "zod";

/**
 * Named presets. All print with the en-US locale unless the descriptor says
 * otherwise, so the server, headless Chromium and the browser agree.
 *
 * - `integer`: 12,345
 * - `decimal`: 12,345.6 (one decimal)
 * - `compact`: 12k, 1.2m
 * - `percent`: a fraction as a percentage, 0.12 prints 12%
 */
export const FORMAT_PRESETS = [
  "integer",
  "decimal",
  "compact",
  "percent",
] as const;

/** The Intl.NumberFormat options a descriptor may carry (plus `locale`). */
export const intlFormatSchema = z.strictObject({
  compactDisplay: z.enum(["short", "long"]).optional(),
  currency: z.string().length(3).optional(),
  locale: z.string().min(2).optional(),
  maximumFractionDigits: z.number().int().min(0).max(20).optional(),
  minimumFractionDigits: z.number().int().min(0).max(20).optional(),
  notation: z.enum(["standard", "compact"]).optional(),
  signDisplay: z.enum(["auto", "always", "exceptZero", "never"]).optional(),
  style: z.enum(["decimal", "percent", "currency", "unit"]).optional(),
  unit: z.string().optional(),
  useGrouping: z.boolean().optional(),
});

/** A formatter as data: a preset name or Intl number-format options. */
export const formatSchema = z.union([z.enum(FORMAT_PRESETS), intlFormatSchema]);

export type FormatDescriptor = z.infer<typeof formatSchema>;
/** What a chart prop accepts: a descriptor, or (TypeScript only) a function. */
export type FormatInput = FormatDescriptor | ((value: number) => string);

/**
 * A function passed where a descriptor goes (TypeScript callers only). The
 * parse is what tells it from data; the typed pipe is the contract.
 */
const formatFunctionSchema = z
  .instanceof(Function)
  .pipe(z.custom<(value: number) => string>());
const dateFunctionSchema = z
  .instanceof(Function)
  .pipe(z.custom<(date: Date) => string>());

const presetSchema = z.enum(FORMAT_PRESETS);

const PRESETS = {
  compact: new Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
  }),
  decimal: new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }),
  integer: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
  percent: new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    style: "percent",
  }),
};

/** Custom descriptors, built once each: charts resolve on every render. */
const built = new Map<string, Intl.NumberFormat>();

/**
 * Turn any `FormatInput` into a function; `undefined` prints with `String`.
 * Throws on a descriptor the schema would reject: validate payloads first.
 */
export const resolveFormat = (
  input: FormatInput | undefined
): ((value: number) => string) => {
  if (input === undefined) {
    return String;
  }
  const custom = formatFunctionSchema.safeParse(input);
  if (custom.success) {
    return custom.data;
  }
  const preset = presetSchema.safeParse(input);
  if (preset.success) {
    return (value) => PRESETS[preset.data].format(value);
  }
  const key = JSON.stringify(input);
  let intl = built.get(key);
  if (intl === undefined) {
    const { locale, ...options } = intlFormatSchema.parse(input);
    intl = new Intl.NumberFormat(locale ?? "en-US", options);
    built.set(key, intl);
  }
  const formatter = intl;
  return (value) => formatter.format(value);
};

/**
 * Named date presets, printed in UTC so a day is the same day everywhere.
 *
 * - `day-month`: 4 Mar
 * - `day-month-year`: 4 Mar 2024
 * - `month-year`: Mar 2024
 */
export const DATE_FORMAT_PRESETS = [
  "day-month",
  "day-month-year",
  "month-year",
] as const;

/** A date formatter as data: a preset name. */
export const dateFormatSchema = z.enum(DATE_FORMAT_PRESETS);

export type DateFormatDescriptor = z.infer<typeof dateFormatSchema>;
/** What a chart prop accepts: a preset, or (TypeScript only) a function. */
export type DateFormatInput = DateFormatDescriptor | ((date: Date) => string);

const DATE_PRESETS = {
  "day-month": utcFormat("%-d %b"),
  "day-month-year": utcFormat("%-d %b %Y"),
  "month-year": utcFormat("%b %Y"),
};

/** Turn any `DateFormatInput` into a function; `undefined` is `day-month`. */
export const resolveDateFormat = (
  input: DateFormatInput | undefined
): ((date: Date) => string) => {
  if (input === undefined) {
    return DATE_PRESETS["day-month"];
  }
  const custom = dateFunctionSchema.safeParse(input);
  if (custom.success) {
    return custom.data;
  }
  return DATE_PRESETS[dateFormatSchema.parse(input)];
};
