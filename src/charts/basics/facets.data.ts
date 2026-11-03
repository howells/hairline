import {
  MONTHS,
  monthlyGeneration,
  weeklyDemand,
  weeklyNuclear,
  weeklyWind,
} from "../../lib/data";
import type { Point } from "../../lib/data";
import type { DailyDatum } from "../../schema/daily";
import type { RungDatum } from "../../schema/rung-bars";

/**
 * F18 Weekly supply and demand, F19 Fuels by quarter: Great Britain's
 * electricity, from the tables in src/lib/data.ts (whose header gives each
 * source and transform): national demand (NESO), wind and nuclear generation
 * (Elexon FUELHH), weekly in GWh for 2024, and monthly generation by fuel in TWh
 * for 2024. Fetched 2026-10-15. Transform here: dates to ISO strings, weeks
 * of 2024 only, and each fuel's months summed into quarters, rounded to TWh.
 */
const daily = (points: Point[]): DailyDatum[] =>
  points.map((p) => ({
    date: p.date.toISOString().slice(0, 10),
    value: p.value,
  }));

const inYear = (p: Point) => p.date.getUTCFullYear() === 2024;

export const weeklySeries = [
  { data: daily(weeklyDemand.filter(inYear)), key: "demand", name: "Demand" },
  { data: daily(weeklyWind.filter(inYear)), key: "wind", name: "Wind" },
  {
    data: daily(weeklyNuclear.filter(inYear)),
    key: "nuclear",
    name: "Nuclear",
  },
];

const in2024 = MONTHS.flatMap((date, i) =>
  date.getUTCFullYear() === 2024 ? [i] : []
);

/** 2024's four quarters, each the whole TWh generated in its three months. */
const quarters = (values: number[]): RungDatum[] =>
  [0, 1, 2, 3].map((q) => ({
    label: `Q${q + 1}`,
    value: Math.round(
      in2024.slice(q * 3, q * 3 + 3).reduce((sum, i) => sum + values[i], 0)
    ),
  }));

export const quarterlySeries = [
  { data: quarters(monthlyGeneration.gas), key: "gas", name: "Gas" },
  { data: quarters(monthlyGeneration.wind), key: "wind", name: "Wind" },
  {
    data: quarters(monthlyGeneration.nuclear),
    key: "nuclear",
    name: "Nuclear",
  },
  { data: quarters(monthlyGeneration.other), key: "other", name: "Other" },
];
