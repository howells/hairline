/**
 * The Vitals grid: nine small multiples of the Great Britain electricity
 * system, January 2023 to December 2024.
 *
 * Source: every series is a table in src/lib/data.ts (weekly demand, wind,
 * carbon intensity, imports and lowest frequency; monthly solar, gas share
 * and demand change; the wind year-on-year weeks). That file's header gives
 * each source URL (NESO historic demand, Elexon FUELHH, NESO Carbon Intensity
 * API, NESO System Frequency, Clean Power 2030 Action Plan) and the transform
 * of each series. Fetched 2026-10-15.
 *
 * Transform local to this file: every cursor rests on the week of the lowest
 * weekly frequency of the two years (Monday 18 December 2023) or, in a monthly
 * cell, on December 2023; the year-on-year cell holds only 2024 and rests on
 * the week of Storm Darragh (Monday 2 December 2024). The gas cell's plan line
 * is the Action Plan's 5% and the frequency cell's threshold is the 49.5 Hz
 * statutory limit.
 */
import {
  FREQUENCY_LIMIT,
  GAS_PLAN_SHARE,
  carbonMean,
  demandChange,
  lowestFrequency,
  monthIndex,
  monthlyShare,
  monthlySolar,
  weeklyDemand,
  weeklyImports,
  weeklyWind,
  windYearOnYear,
} from "../../lib/data";
import type { Point } from "../../lib/data";
import { fmtGCO2, fmtGWh, fmtHz, fmtSignedPct, fmtTWh } from "../../lib/format";
import { lowestIndex } from "./extremes";

interface SparkCellBase {
  /** Heading over the cell. */
  title: string;
  /** Accessible name for the cell's chart. */
  label: string;
  domain: [number, number];
  format: (v: number) => string;
}

/**
 * Monthly bars. "bars" is a plain column per month, "diverging" hangs signed
 * values from the zero rule, "plan" engraves the part over `plan` in ink.
 */
export interface SparkBarCell extends SparkCellBase {
  kind: "bars" | "diverging" | "plan";
  values: (number | null)[];
  /** One per value, first of the month in UTC. Defaults to Jan 2023 – Dec 2024. */
  months?: Date[];
  /** The cell's plan line, for kind "plan". */
  plan?: number;
  /** Resting cursor index; null leaves every bar inked. Defaults to the last month. */
  rest?: number | null;
}

/** A weekly (or daily) line. "step" draws a filled staircase. */
export interface SparkLineCell extends SparkCellBase {
  kind: "line" | "step";
  data: Point[];
  /** 1 = ink (default), 2 = grey. */
  tone?: 1 | 2;
  /** Shade under the line. */
  area?: boolean;
  /** A zero rule. */
  zero?: boolean;
  /** Paint the line red on the far side of this value. */
  threshold?: { value: number; alert: "above" | "below" };
  /** Resting cursor index. Defaults to the last point. */
  rest?: number;
}

export type SparkCell = SparkBarCell | SparkLineCell;

/**
 * Where every cell's cursor rests: the week of the lowest system frequency of
 * the two years (18 December 2023), and its month.
 */
const WEEK_REST = lowestIndex(lowestFrequency.map((p) => p.value));
const MONTH_REST = monthIndex("2023-12");

/** The 2024 wind change cell holds only 2024, so it rests on Storm Darragh. */
const YEAR_ON_YEAR_REST = windYearOnYear.findIndex(
  (p) => p.date.toISOString() === "2024-12-02T00:00:00.000Z"
);

/** The board's nine vitals, Jan 2023 – Dec 2024. */
export const sparkGridDemo: SparkCell[] = [
  {
    data: weeklyDemand,
    domain: [0, 6500],
    format: fmtGWh,
    kind: "line",
    label: "National demand a week",
    rest: WEEK_REST,
    title: "Demand",
    tone: 2,
  },
  {
    data: weeklyWind,
    domain: [0, 3600],
    format: fmtGWh,
    kind: "line",
    label: "Wind generation a week",
    rest: WEEK_REST,
    title: "Wind",
  },
  {
    domain: [0, 3],
    format: fmtTWh,
    kind: "bars",
    label: "Solar generation a month",
    rest: MONTH_REST,
    title: "Solar",
    values: monthlySolar,
  },
  {
    domain: [0, 50],
    format: (v) => `${v.toFixed(0)}%`,
    kind: "plan",
    label: "Gas share of generation a month against the 2030 plan",
    plan: GAS_PLAN_SHARE,
    rest: MONTH_REST,
    title: "Gas share",
    values: monthlyShare.gas,
  },
  {
    domain: [-15, 20],
    format: (v) => fmtSignedPct(v),
    kind: "diverging",
    label: "Mean daily demand, change on the month before",
    rest: MONTH_REST,
    title: "Demand change",
    values: demandChange,
  },
  {
    data: windYearOnYear,
    domain: [-80, 170],
    format: (v) => fmtSignedPct(v),
    kind: "line",
    label: "Wind generation, change on the same week a year before",
    rest: YEAR_ON_YEAR_REST,
    title: "Wind, year on year",
    zero: true,
  },
  {
    area: true,
    data: carbonMean,
    domain: [0, 280],
    format: fmtGCO2,
    kind: "line",
    label: "Mean carbon intensity a week",
    rest: WEEK_REST,
    title: "Carbon intensity",
  },
  {
    data: weeklyImports,
    domain: [-200, 1100],
    format: fmtGWh,
    kind: "line",
    label: "Net imports a week",
    rest: WEEK_REST,
    title: "Imports",
    tone: 2,
    zero: true,
  },
  {
    data: lowestFrequency,
    domain: [49.2, 49.9],
    format: fmtHz,
    kind: "line",
    label: "Lowest system frequency a week",
    rest: WEEK_REST,
    threshold: { alert: "below", value: FREQUENCY_LIMIT },
    title: "Lowest frequency",
  },
];
