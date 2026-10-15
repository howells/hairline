import type { ReactNode } from "react";

import {
  ENDPOINT_TARGET,
  ERROR_SERVICES,
  ERROR_THRESHOLD,
  HALF_YEAR_WEEKS,
  SEARCH_TARGET,
  SPEND_BUDGET,
  assistantUsers,
  cityLatency,
  cloudSpend,
  endpoints,
  errorRates,
  funnel,
  monthIndex,
  monthlyActive,
  planShare,
  platformSessions,
  platformUsers,
  searchP50,
  searchP95,
  serviceLatency,
  serviceRequests,
  signupChange,
  signupGrowth,
  syncUptime,
  weekIndex,
  weeklyActive,
} from "../../lib/data";
import type { Point } from "../../lib/data";
import { fmtInt, fmtK, fmtMoney, fmtMs, fmtSignedPct } from "../../lib/format";
import { Dumbbell } from "./dumbbell";
import { EndpointStrip } from "./endpoint-strip";
import { HBars } from "./h-bars";
import { Heatmap } from "./heatmap";
import { MonthlyBars } from "./monthly-bars";
import { Sankey } from "./sankey";
import { Scatter } from "./scatter";
import { Slope } from "./slope";
import { SparkGrid } from "./spark-grid";
import { StackedArea } from "./stacked-area";
import { TimeLines } from "./time-lines";
import { fmtCountTick, fmtM } from "./units";

/** Steps of `step` from `from` to `to`, inclusive. */
const range = (from: number, to: number, step: number) =>
  Array.from(
    { length: Math.round((to - from) / step) + 1 },
    (_, i) => from + i * step
  );

const USER_TICKS = range(0, 300_000, 50_000);
const LAUNCH_MONTH = monthIndex("2025-06");

/** The week uptime fell furthest below its SLA: where the cursor rests. */
const lowestWeek = (points: Point[]) => {
  let low = 0;
  for (const [i, d] of points.entries()) {
    if (d.value < points[low].value) {
      low = i;
    }
  }
  return low;
};

/**
 * 2026 from its first full week to mid-December, and the same weeks of 2025
 * set on 2026's dates: the holiday weeks at either end are left out.
 */
const FIRST_OF_2026 = weekIndex("2026-01-05");
const YEAR_WEEKS = 50;
const thisYear = weeklyActive.slice(FIRST_OF_2026, FIRST_OF_2026 + YEAR_WEEKS);
const lastYear = weeklyActive
  .slice(1, 1 + YEAR_WEEKS)
  .map((p, i) => ({ date: thisYear[i].date, value: p.value }));

/** Endpoints as scatter points: reads filled, writes hollow, two named. */
const NAMED = new Set(["POST /export/pdf", "POST /assistant/draft"]);
const endpointPoints = endpoints.map((e) => ({
  group: e.route.startsWith("GET") ? ("filled" as const) : ("hollow" as const),
  name: NAMED.has(e.route) ? e.route : undefined,
  x: e.rps,
  y: e.p95,
}));

/** Thousands of sessions on the scale: "300k", "1.2m". */
const sessionsTick = (v: number) => fmtCountTick(v * 1000);

export interface BoardPreset {
  name: string;
  render: () => ReactNode;
}

/** Board presets by id ("D1"…"D19"); the boards page looks them up by id. */
export interface BoardPresetMap {
  [id: string]: BoardPreset;
}

/** The dashboard charts, configured as on the boards. D1–D19. */
export const BOARD_PRESETS: BoardPresetMap = {
  D1: {
    name: "Assistant uptake",
    render: () => (
      <TimeLines
        label="Weekly Assistant users against all weekly active users"
        height={440}
        rest={weekIndex("2025-09-01")}
        readout="tags"
        fill="gap"
        future="none"
        series={[
          { data: assistantUsers, format: fmtInt, name: "Assistant", tone: 1 },
          {
            data: weeklyActive,
            format: fmtInt,
            name: "Weekly active",
            tone: 2,
          },
        ]}
        y={{ domain: [0, 300_000], format: fmtCountTick, ticks: USER_TICKS }}
      />
    ),
  },
  D10: {
    name: "Annual sign-up growth",
    render: () => (
      <TimeLines
        label="Weekly sign-ups, change on the same week a year before"
        height={440}
        rest={signupGrowth.length - 1}
        cursorAtRest={false}
        readout="none"
        bands={[
          {
            from: new Date(Date.UTC(2025, 6, 21)),
            label: "Summer",
            to: new Date(Date.UTC(2025, 7, 31)),
          },
          {
            from: new Date(Date.UTC(2026, 6, 20)),
            label: "Summer",
            to: new Date(Date.UTC(2026, 7, 30)),
          },
        ]}
        series={[
          { data: signupGrowth, format: (v) => fmtSignedPct(v), tone: 1 },
        ]}
        y={{
          domain: [0, 70],
          format: (v) => fmtSignedPct(v),
          side: "right",
          ticks: range(0, 70, 10),
        }}
      />
    ),
  },
  D11: {
    name: "This year and last",
    render: () => (
      <TimeLines
        label="Weekly active users, 2026 against the same weeks of 2025"
        height={410}
        rest={weekIndex("2026-04-20") - FIRST_OF_2026}
        series={[
          { data: thisYear, format: fmtInt, name: "2026", tone: 1 },
          { data: lastYear, format: fmtInt, name: "2025", tone: 2 },
        ]}
        y={{ domain: [0, 300_000], format: fmtCountTick, ticks: USER_TICKS }}
      />
    ),
  },
  D12: {
    name: "Active users",
    render: () => (
      <TimeLines
        label="Monthly active users, measured weekly"
        height={440}
        rest={weekIndex("2026-01-26")}
        readout="figure"
        fill="area"
        texture="stipple"
        series={[{ data: monthlyActive, format: fmtInt, tone: 1 }]}
        y={{
          domain: [0, 450_000],
          format: fmtCountTick,
          side: "right",
          ticks: range(0, 450_000, 50_000),
        }}
      />
    ),
  },
  D13: {
    name: "Cloud spend",
    render: () => (
      <MonthlyBars
        label="Cloud spend a month against budget"
        height={440}
        rest={LAUNCH_MONTH}
        readout="value"
        budget={{
          label: `Budget ${fmtMoney(SPEND_BUDGET)}`,
          value: SPEND_BUDGET,
        }}
        stacks={[{ tone: "s1", values: cloudSpend }]}
        y={{
          domain: [0, 200_000],
          format: fmtMoney,
          side: "right",
          ticks: range(0, 200_000, 50_000),
        }}
        format={fmtMoney}
      />
    ),
  },
  D14: {
    name: "Revenue by plan",
    render: () => (
      <MonthlyBars
        label="Share of recurring revenue by plan"
        height={440}
        rest={planShare.length - 1}
        stacks={[
          {
            label: "Enterprise",
            tone: "s1",
            values: planShare.map((d) => d.enterprise),
          },
          {
            label: "Business",
            tone: "s2",
            values: planShare.map((d) => d.business),
          },
          { label: "Pro", tone: "s3", values: planShare.map((d) => d.pro) },
          { label: "Plus", tone: "s4", values: planShare.map((d) => d.plus) },
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
    name: "Latency by city",
    render: () => (
      <Dumbbell
        label="Page load P95 by city, January 2025 against December 2026"
        height={410}
        rows={cityLatency}
        ticks={range(0, 450, 150)}
        ends={["Jan 2025", "Dec 2026"]}
      />
    ),
  },
  D17: {
    name: "Errors by hour",
    render: () => (
      <Heatmap
        label="Error rate by service and hour of the day"
        rows={ERROR_SERVICES}
        values={errorRates}
        threshold={ERROR_THRESHOLD}
        domain={[0.1, 2.4]}
      />
    ),
  },
  D18: {
    name: "Sync uptime",
    render: () => (
      <TimeLines
        label="Weekly uptime of sync"
        height={440}
        rest={lowestWeek(syncUptime)}
        readout="value"
        dateReadout
        fill="area"
        texture="screen"
        series={[
          { data: syncUptime, format: (v) => `${v.toFixed(2)}%`, tone: 1 },
        ]}
        threshold={{ alert: "below", label: "SLA 99.9%", value: 99.9 }}
        y={{
          domain: [99.4, 100],
          format: (v) => (v === 100 ? "100%" : `${v.toFixed(1)}%`),
          side: "right",
          ticks: [99.4, 99.6, 99.8, 100],
        }}
      />
    ),
  },
  D19: {
    name: "Every endpoint",
    render: () => (
      <EndpointStrip
        label="P95 latency of every endpoint, by service"
        height={440}
        endpoints={endpoints}
        target={ENDPOINT_TARGET}
        ticks={range(0, 700, 100)}
      />
    ),
  },
  D2: {
    name: "Sessions by platform",
    render: () => (
      <StackedArea
        label="Weekly sessions by platform, second half of 2026"
        height={440}
        dates={HALF_YEAR_WEEKS}
        format={(v) => `${v}k`}
        y={{
          domain: [0, 1200],
          format: sessionsTick,
          ticks: range(0, 1200, 300),
        }}
        layers={[
          {
            fill: "var(--area1)",
            label: "Web",
            stroke: "var(--l3)",
            text: "var(--muted)",
            texture: "hatch",
            values: platformSessions.web,
          },
          {
            fill: "var(--area2)",
            label: "Desktop",
            stroke: "var(--l3)",
            text: "var(--muted)",
            texture: "upright",
            values: platformSessions.desktop,
          },
          {
            fill: "var(--area2)",
            label: "iOS",
            stroke: "var(--l3)",
            text: "var(--muted)",
            texture: "stipple",
            values: platformSessions.ios,
          },
          {
            fill: "var(--area3)",
            label: "Android",
            stroke: "var(--ink)",
            text: "var(--text)",
            texture: "rules",
            values: platformSessions.android,
          },
        ]}
      />
    ),
  },
  D3: {
    name: "Search latency",
    render: () => (
      <TimeLines
        label="Search P95 and P50 latency"
        height={410}
        rest={weekIndex("2025-11-24")}
        fill="band"
        texture="rules"
        series={[
          { data: searchP95, format: fmtMs, name: "P95", tone: 1 },
          { data: searchP50, format: fmtMs, name: "P50", tone: 2 },
        ]}
        threshold={{ label: "Target", value: SEARCH_TARGET }}
        y={{
          domain: [0, 360],
          format: fmtMs,
          ticks: range(0, 360, 60),
        }}
      />
    ),
  },
  D4: {
    name: "Users by platform",
    render: () => (
      <MonthlyBars
        label="Monthly active users by platform"
        height={410}
        rest={monthIndex("2025-09")}
        readout="legend"
        stacks={[
          { label: "Web", tone: "s1", values: platformUsers.web },
          { label: "Desktop", tone: "s2", values: platformUsers.desktop },
          { label: "iOS", tone: "s3", values: platformUsers.ios },
          { label: "Android", tone: "s4", values: platformUsers.android },
        ]}
        y={{
          domain: [0, 500_000],
          format: fmtCountTick,
          ticks: range(0, 500_000, 100_000),
        }}
        format={fmtK}
      />
    ),
  },
  D5: {
    name: "Monthly sign-up change",
    render: () => (
      <MonthlyBars
        label="New accounts, change on the month before"
        height={440}
        rest={LAUNCH_MONTH}
        readout="value"
        diverging
        stacks={[{ tone: "s1", values: signupChange }]}
        y={{
          domain: [-20, 40],
          format: (v) => fmtSignedPct(v),
          side: "right",
          ticks: range(-20, 40, 10),
        }}
        format={(v) => fmtSignedPct(v)}
      />
    ),
  },
  D6: {
    name: "Requests by service",
    render: () => (
      <HBars
        label="Requests a day by service"
        height={440}
        rows={serviceRequests}
        ticks={range(0, 80_000_000, 20_000_000)}
        format={fmtM}
        tickFormat={fmtCountTick}
      />
    ),
  },
  D7: {
    name: "Service latency",
    render: () => (
      <Slope
        label="Service P95 latency, January 2025 against December 2026"
        height={420}
        rows={serviceLatency}
        labels={["Jan 2025", "Dec 2026"]}
        domain={[40, 680]}
      />
    ),
  },
  D8: {
    name: "Throughput and latency",
    render: () => (
      <Scatter
        label="Endpoint peak throughput against P95 latency"
        height={410}
        points={endpointPoints}
        groups={{ filled: "Reads", hollow: "Writes" }}
        sla={ENDPOINT_TARGET}
        thresholdLabel="Target"
        xDomain={[0, 1200]}
        xTicks={range(0, 1200, 300)}
        xTitle="Peak requests/s"
        yTitle="P95 latency"
        yDomain={[0, 700]}
        yTicks={range(0, 700, 100)}
      />
    ),
  },
  D9: {
    name: "Trial funnel",
    render: () => (
      <Sankey
        label="One month's visitors, from first visit to day 90"
        height={440}
        data={funnel}
      />
    ),
  },
};
