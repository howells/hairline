import {
  SEARCH_TARGET,
  SPEND_BUDGET,
  assistantUsers,
  cloudSpend,
  filesStored,
  monthIndex,
  searchP95,
  signupChange,
  signupGrowth,
  signups,
  tickets,
  weekIndex,
  weeklyActive,
} from "../../lib/data";
import type { Point } from "../../lib/data";
import { fmtInt, fmtMoney, fmtMs, fmtSignedPct } from "../../lib/format";

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
 * values from the zero rule, "budget" engraves the part over `budget` in ink.
 */
export interface SparkBarCell extends SparkCellBase {
  kind: "bars" | "diverging" | "budget";
  values: (number | null)[];
  /** One per value, first of the month in UTC. Defaults to Jan 2025 – Dec 2026. */
  months?: Date[];
  /** The cell's budget line, for kind "budget". */
  budget?: number;
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

/** Where every cell's cursor rests: the month Assistant shipped. */
const WEEK_REST = weekIndex("2025-06-02");
const MONTH_REST = monthIndex("2025-06");

/** Fieldnote's nine vitals, Jan 2025 – Dec 2026. */
export const sparkGridDemo: SparkCell[] = [
  {
    domain: [0, 100_000],
    format: fmtInt,
    kind: "bars",
    label: "New accounts a month",
    rest: MONTH_REST,
    title: "New accounts",
    values: signups,
  },
  {
    budget: SPEND_BUDGET,
    domain: [0, 180_000],
    format: fmtMoney,
    kind: "budget",
    label: "Cloud spend a month against budget",
    rest: MONTH_REST,
    title: "Cloud spend",
    values: cloudSpend,
  },
  {
    domain: [-20, 35],
    format: (v) => fmtSignedPct(v),
    kind: "diverging",
    label: "New accounts, month on month",
    rest: MONTH_REST,
    title: "Account growth",
    values: signupChange,
  },
  {
    data: weeklyActive,
    domain: [0, 290_000],
    format: fmtInt,
    kind: "line",
    label: "Weekly active users",
    rest: WEEK_REST,
    title: "Weekly active",
    tone: 2,
  },
  {
    data: assistantUsers,
    domain: [-8000, 230_000],
    format: fmtInt,
    kind: "line",
    label: "Weekly Assistant users",
    rest: WEEK_REST,
    title: "Assistant",
  },
  {
    data: signupGrowth,
    domain: [-10, 70],
    format: (v) => fmtSignedPct(v),
    kind: "line",
    label: "Sign-ups, year on year",
    rest: WEEK_REST,
    title: "Year on year",
    zero: true,
  },
  {
    area: true,
    data: searchP95,
    domain: [0, 340],
    format: fmtMs,
    kind: "line",
    label: "Search P95 latency",
    rest: WEEK_REST,
    threshold: { alert: "above", value: SEARCH_TARGET },
    title: "Search P95",
  },
  {
    area: true,
    data: filesStored,
    domain: [0, 130],
    format: (v) => `${fmtInt(v)} TB`,
    kind: "step",
    label: "Files stored",
    rest: WEEK_REST,
    title: "Files stored",
  },
  {
    data: tickets,
    domain: [0, 700],
    format: fmtInt,
    kind: "line",
    label: "Support tickets a week",
    rest: WEEK_REST,
    title: "Tickets",
    tone: 2,
  },
];
