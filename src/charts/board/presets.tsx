import type { ReactNode } from "react";

import {
  FREQUENCY_LIMIT,
  GAS_PLAN_SHARE,
  HALF_YEAR_WEEKS,
  HEAT_ROWS,
  STORMS,
  carbonMean,
  carbonPeak,
  cleanerRegions,
  demand2023,
  demand2024,
  demandChange,
  energyFlow,
  fuelsIn2024,
  halfYearGeneration,
  hourlyIntensity,
  lowestFrequency,
  monthlyGeneration,
  monthlyShare,
  regionChange,
  stations,
  weeklyDemand,
  weeklyNuclear,
  weeklyWind,
  windYearOnYear,
} from "../../lib/data";
import type { Point } from "../../lib/data";
import {
  fmtGCO2,
  fmtGWh,
  fmtHz,
  fmtInt,
  fmtSignedGCO2,
  fmtSignedPct,
  fmtTWh,
} from "../../lib/format";
import { Dumbbell } from "./dumbbell";
import { highestIndex, lowestIndex } from "./extremes";
import { HBars } from "./h-bars";
import { Heatmap } from "./heatmap";
import { MonthlyBars } from "./monthly-bars";
import { Sankey } from "./sankey";
import { Scatter } from "./scatter";
import type { ScatterPoint } from "./scatter";
import { Slope } from "./slope";
import { SparkGrid } from "./spark-grid";
import { StackedArea } from "./stacked-area";
import { StationStrip } from "./station-strip";
import { TimeLines } from "./time-lines";

/** Steps of `step` from `from` to `to`, inclusive. */
const range = (from: number, to: number, step: number) =>
  Array.from(
    { length: Math.round((to - from) / step) + 1 },
    (_, i) => from + i * step
  );

const values = (points: Point[]) => points.map((p) => p.value);

/** The week of the lowest frequency of the two years, 18 December 2023. */
const LOWEST_FREQUENCY_WEEK = lowestIndex(values(lowestFrequency));

/** The windiest week of 2023: the same week the frequency was lowest. */
const WINDIEST_WEEK = highestIndex(values(weeklyWind).slice(0, 52));

/** Where 2024 and 2023 part furthest, either way, after the first ten weeks. */
const GAP_FROM = 10;
const WIDEST_GAP =
  GAP_FROM +
  highestIndex(
    demand2024
      .slice(GAP_FROM)
      .map((p, i) => Math.abs(p.value - demand2023[GAP_FROM + i].value))
  );

/** The month gas gave the least of the generation. */
const LEAST_GAS_MONTH = lowestIndex(monthlyShare.gas);

/** The month gas gave the most of the generation. */
const MOST_GAS_MONTH = highestIndex(monthlyShare.gas);

/** The month demand moved furthest from the one before. */
const BIGGEST_MOVE_MONTH = highestIndex(
  demandChange.map((v) => (v === null ? 0 : Math.abs(v)))
);

const tickGWh = (v: number) => fmtInt(v);

/** The sites too long to print beside their dot, as DUKES names them. */
const SHORT_NAMES = new Map([
  ["Drax Power Station Biomass Units", "Drax"],
  ["Ratcliffe (Steam)", "Ratcliffe"],
]);

const FOSSIL = new Set(["Coal", "Gas", "Oil"]);

/** Stations of 1,000 MW or more: capacity against age, fossil hollow. */
const gigawattStations: ScatterPoint[] = [];
for (const s of stations) {
  if (s.mw >= 1000) {
    gigawattStations.push({
      group: FOSSIL.has(s.fuel) ? "hollow" : "filled",
      name: SHORT_NAMES.get(s.name),
      title: s.name,
      x: s.age,
      y: s.mw,
    });
  }
}

export interface BoardPreset {
  name: string;
  render: () => ReactNode;
}

/** Board presets by id ("D1"…"D19"); the boards page looks them up by id. */
export interface BoardPresetMap {
  [id: string]: BoardPreset;
}

/** The grid's charts, configured as on the boards. D1–D19. */
export const BOARD_PRESETS: BoardPresetMap = {
  D1: {
    name: "Wind and demand",
    render: () => (
      <TimeLines
        label="Weekly wind generation against national demand"
        height={440}
        rest={WINDIEST_WEEK}
        readout="tags"
        fill="gap"
        future="none"
        series={[
          { data: weeklyWind, format: fmtGWh, name: "Wind", tone: 1 },
          { data: weeklyDemand, format: fmtGWh, name: "Demand", tone: 2 },
        ]}
        y={{ domain: [0, 6000], format: tickGWh, ticks: range(0, 6000, 1000) }}
      />
    ),
  },
  D10: {
    name: "Wind, year on year",
    render: () => (
      <TimeLines
        label="Weekly wind generation, change on the same week a year before"
        height={440}
        rest={windYearOnYear.length - 1}
        cursorAtRest={false}
        readout="none"
        bands={STORMS}
        zero
        series={[
          { data: windYearOnYear, format: (v) => fmtSignedPct(v), tone: 1 },
        ]}
        y={{
          domain: [-100, 200],
          format: (v) => fmtSignedPct(v),
          side: "right",
          ticks: range(-100, 200, 50),
        }}
      />
    ),
  },
  D11: {
    name: "2024 against 2023",
    render: () => (
      <TimeLines
        label="Weekly national demand, 2024 against the same weeks of 2023"
        height={410}
        rest={WIDEST_GAP}
        series={[
          { data: demand2024, format: fmtGWh, name: "2024", tone: 1 },
          { data: demand2023, format: fmtGWh, name: "2023", tone: 2 },
        ]}
        y={{ domain: [0, 6000], format: tickGWh, ticks: range(0, 6000, 1000) }}
      />
    ),
  },
  D12: {
    name: "Nuclear output",
    render: () => (
      <TimeLines
        label="Weekly nuclear generation"
        height={440}
        rest={lowestIndex(values(weeklyNuclear))}
        readout="figure"
        fill="area"
        texture="stipple"
        series={[{ data: weeklyNuclear, format: fmtGWh, tone: 1 }]}
        y={{
          domain: [0, 1000],
          format: tickGWh,
          side: "right",
          ticks: range(0, 1000, 200),
        }}
      />
    ),
  },
  D13: {
    name: "Gas against the plan",
    render: () => (
      <MonthlyBars
        label="Gas's share of generation a month against the Clean Power 2030 plan"
        height={440}
        rest={MOST_GAS_MONTH}
        readout="value"
        plan={{
          label: `2030 plan ${GAS_PLAN_SHARE}%`,
          value: GAS_PLAN_SHARE,
        }}
        stacks={[{ tone: "s1", values: monthlyShare.gas }]}
        y={{
          domain: [0, 50],
          format: (v) => `${v}%`,
          side: "right",
          ticks: range(0, 50, 10),
        }}
        format={(v) => `${v.toFixed(0)}%`}
      />
    ),
  },
  D14: {
    name: "Share by fuel",
    render: () => (
      <MonthlyBars
        label="Share of generation by fuel"
        height={440}
        rest={monthlyShare.gas.length - 1}
        stacks={[
          { label: "Gas", tone: "s1", values: monthlyShare.gas },
          { label: "Wind", tone: "s2", values: monthlyShare.wind },
          { label: "Nuclear", tone: "s3", values: monthlyShare.nuclear },
          { label: "Other", tone: "s4", values: monthlyShare.other },
        ]}
        y={{
          domain: [0, 100],
          format: (v) => `${v}%`,
          ticks: range(0, 100, 20),
        }}
        format={(v) => `${v.toFixed(0)}%`}
      />
    ),
  },
  D15: {
    name: "Vitals",
    render: () => <SparkGrid height={100} />,
  },
  D16: {
    name: "Intensity by region",
    render: () => (
      <Dumbbell
        label="Carbon intensity by region, January 2023 against December 2024"
        height={410}
        rows={regionChange}
        ticks={range(0, 300, 100)}
        tickFormat={(t) => (t === 0 ? "0" : fmtGCO2(t))}
        deltaFormat={fmtSignedGCO2}
        ends={["Jan 2023", "Dec 2024"]}
      />
    ),
  },
  D17: {
    name: "Dirty hours",
    render: () => (
      <Heatmap
        label="Carbon intensity by region and hour of the day"
        rows={HEAT_ROWS}
        values={hourlyIntensity}
        threshold={300}
        domain={[0, 300]}
        format={fmtGCO2}
      />
    ),
  },
  D18: {
    name: "Frequency",
    render: () => (
      <TimeLines
        label="Weekly lowest system frequency against the statutory limit"
        height={440}
        rest={LOWEST_FREQUENCY_WEEK}
        readout="value"
        dateReadout
        fill="area"
        texture="screen"
        series={[{ data: lowestFrequency, format: fmtHz, tone: 1 }]}
        threshold={{
          alert: "below",
          label: `Limit ${FREQUENCY_LIMIT} Hz`,
          value: FREQUENCY_LIMIT,
        }}
        y={{
          domain: [49.2, 49.9],
          format: (v) => v.toFixed(1),
          side: "right",
          ticks: [49.2, 49.4, 49.6, 49.8],
        }}
      />
    ),
  },
  D19: {
    name: "Stations by fuel",
    render: () => (
      <StationStrip
        label="Age of every power station of 100 MW or more, by fuel"
        height={440}
        stations={stations.map((s) => ({
          group: s.fuel,
          name: s.name,
          value: s.age,
        }))}
        format={(v) => `${v} yr`}
        medianTitle="Median"
        ticks={range(0, 70, 10)}
      />
    ),
  },
  D2: {
    name: "Generation by fuel",
    render: () => (
      <StackedArea
        label="Weekly generation by fuel, second half of 2024"
        height={440}
        dates={HALF_YEAR_WEEKS}
        format={fmtGWh}
        y={{
          domain: [0, 6000],
          format: tickGWh,
          ticks: range(0, 6000, 2000),
        }}
        layers={[
          {
            fill: "var(--area1)",
            label: "Nuclear",
            stroke: "var(--l3)",
            text: "var(--muted)",
            texture: "hatch",
            values: halfYearGeneration.nuclear,
          },
          {
            fill: "var(--area2)",
            label: "Gas",
            stroke: "var(--l3)",
            text: "var(--muted)",
            texture: "upright",
            values: halfYearGeneration.gas,
          },
          {
            fill: "var(--area2)",
            label: "Imports",
            stroke: "var(--l3)",
            text: "var(--muted)",
            texture: "stipple",
            values: halfYearGeneration.imports,
          },
          {
            fill: "var(--area3)",
            label: "Wind",
            stroke: "var(--ink)",
            text: "var(--text)",
            texture: "rules",
            values: halfYearGeneration.wind,
          },
        ]}
      />
    ),
  },
  D3: {
    name: "Carbon intensity",
    render: () => (
      <TimeLines
        label="Weekly peak and mean carbon intensity"
        height={410}
        rest={highestIndex(values(carbonPeak))}
        fill="band"
        texture="rules"
        series={[
          { data: carbonPeak, format: fmtGCO2, name: "Peak", tone: 1 },
          { data: carbonMean, format: fmtGCO2, name: "Mean", tone: 2 },
        ]}
        y={{
          domain: [0, 350],
          format: fmtInt,
          ticks: range(0, 350, 50),
        }}
      />
    ),
  },
  D4: {
    name: "Monthly mix",
    render: () => (
      <MonthlyBars
        label="Monthly generation by fuel"
        height={410}
        rest={LEAST_GAS_MONTH}
        readout="legend"
        stacks={[
          { label: "Gas", tone: "s1", values: monthlyGeneration.gas },
          { label: "Wind", tone: "s2", values: monthlyGeneration.wind },
          { label: "Nuclear", tone: "s3", values: monthlyGeneration.nuclear },
          { label: "Other", tone: "s4", values: monthlyGeneration.other },
        ]}
        y={{
          domain: [0, 25],
          format: fmtInt,
          ticks: range(0, 25, 5),
        }}
        format={fmtTWh}
      />
    ),
  },
  D5: {
    name: "Demand change",
    render: () => (
      <MonthlyBars
        label="Mean daily national demand, change on the month before"
        height={440}
        rest={BIGGEST_MOVE_MONTH}
        readout="value"
        diverging
        stacks={[{ tone: "s1", values: demandChange }]}
        y={{
          domain: [-20, 20],
          format: (v) => fmtSignedPct(v),
          side: "right",
          ticks: range(-20, 20, 10),
        }}
        format={(v) => fmtSignedPct(v)}
      />
    ),
  },
  D6: {
    name: "A year by fuel",
    render: () => (
      <HBars
        label="Electricity generated in 2024 by fuel"
        height={440}
        rows={fuelsIn2024}
        ticks={range(0, 120, 20)}
        format={(v) => v.toFixed(1)}
        tickFormat={(v) => (v === 120 ? `${v} TWh` : fmtInt(v))}
      />
    ),
  },
  D7: {
    name: "Cleaner regions",
    render: () => (
      <Slope
        label="Carbon intensity, January 2023 against December 2024, the five regions that fell most"
        height={420}
        rows={cleanerRegions}
        labels={["Jan 2023", "Dec 2024"]}
        domain={[60, 300]}
        format={fmtGCO2}
        narrowFormat={fmtInt}
      />
    ),
  },
  D8: {
    name: "Gigawatt stations",
    render: () => (
      <Scatter
        label="Capacity against age of every power station of 1,000 MW or more"
        height={410}
        points={gigawattStations}
        groups={{ filled: "Not fossil", hollow: "Fossil" }}
        xDomain={[0, 70]}
        xTicks={range(0, 70, 10)}
        xTickFormat={fmtInt}
        xFormat={(v) => `${v} yr`}
        xTitle="Age"
        yDomain={[0, 3000]}
        yTicks={range(0, 3000, 1000)}
        yTickFormat={(v) => (v === 0 ? "0" : `${fmtInt(v)} MW`)}
        yFormat={(v) => `${fmtInt(v)} MW`}
        yTitle="Capacity"
      />
    ),
  },
  D9: {
    name: "Where energy goes",
    render: () => (
      <Sankey
        label="Primary energy demand in 2024, from supply to final use"
        height={440}
        data={energyFlow}
      />
    ),
  },
};
