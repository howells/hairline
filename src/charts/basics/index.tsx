import type { GalleryEntry } from "../../gallery/types";
import { fmtGWh, fmtInt } from "../../lib/format";
import { Facets } from "../facets";
import { DumbbellQueue } from "./dumbbell-queue";
import { dumbbellQueueDemo } from "./dumbbell-queue.data";
import { entries as a } from "./entries-a";
import { entries as b } from "./entries-b";
import { quarterlySeries, weeklySeries } from "./facets.data";
import { HairlineArea } from "./hairline-area";
import { HairlineLine } from "./hairline-line";
import { PlumbScatter } from "./plumb-scatter";
import { plumbScatterDemo } from "./plumb-scatter.data";
import { RangeDots } from "./range-dots";
import {
  forecastDemo,
  forecastFrom,
  forecastIntervals,
  levelDemo,
  rangeDemo,
} from "./references.data";
import { RungBars } from "./rung-bars";
import { rungBarsDemo } from "./rung-bars.data";

/** The lowest and highest value of a series, which a facet scale spans. */
const extent = (values: (number | null)[]): [number, number] => {
  const live = values.filter((v): v is number => v !== null);
  return [Math.min(...live), Math.max(...live)];
};

/** Gallery entries for the basics family, in catalogue order. */
const f1: GalleryEntry[] = [
  {
    family: "basics",
    id: "F1",
    name: "Major earthquakes",
    render: () => <RungBars data={rungBarsDemo} format={fmtInt} />,
  },
];

/** The facet wrapper at work: one scale, so size is comparable. */
const facets: GalleryEntry[] = [
  {
    family: "basics",
    id: "F18",
    name: "Supply and demand",
    render: () => (
      <Facets
        axis
        inset={8}
        label="Weekly demand, wind and nuclear generation, 2024"
        minWidth={200}
        panels={weeklySeries.map((s) => ({
          domain: extent(s.data.map((d) => d.value)),
          key: s.key,
          name: s.name,
          value: fmtGWh(s.data.at(-1)?.value ?? 0),
        }))}
      >
        {({ axis, domain, hero, index, panel, width }) => (
          <HairlineArea
            data={weeklySeries[index].data}
            domain={domain}
            emphasis={hero ? undefined : null}
            format={fmtInt}
            height={230}
            title={`${panel.name}, GWh a week`}
            valueAxis={axis}
            width={width}
          />
        )}
      </Facets>
    ),
  },
  {
    family: "basics",
    id: "F19",
    name: "Fuels by quarter",
    render: () => (
      <Facets
        inset={16}
        label="Generation by fuel and quarter, 2024"
        minWidth={200}
        panels={quarterlySeries.map((s) => ({
          domain: extent(s.data.map((d) => d.value)),
          key: s.key,
          name: s.name,
          value: `${fmtInt(s.data.at(-1)?.value ?? 0)} TWh`,
        }))}
      >
        {({ domain, hero, index, panel, width }) => (
          <RungBars
            data={quarterlySeries[index].data}
            emphasis={hero ? undefined : null}
            format={fmtInt}
            height={230}
            max={domain[1]}
            title={`${panel.name}, TWh a quarter`}
            width={width}
          />
        )}
      </Facets>
    ),
  },
];

const percent = (v: number) => `${v}%`;

/** The reference marks and the interval marks: a target, a band, a fan, error bars. */
const marks: GalleryEntry[] = [
  {
    family: "basics",
    id: "R1",
    name: "Years at or over fifteen",
    render: () => (
      <RungBars
        data={rungBarsDemo}
        format={fmtInt}
        references={[{ emphasis: "above", label: "15", value: 15 }]}
      />
    ),
  },
  {
    family: "basics",
    id: "R2",
    name: "Reservoir level",
    render: () => (
      <HairlineLine
        data={levelDemo}
        format={percent}
        references={[
          { from: 56, label: "Normal range", to: 66 },
          { emphasis: "above", label: "Target 70", value: 70 },
        ]}
      />
    ),
  },
  {
    family: "basics",
    id: "R3",
    name: "Museum visits over six million",
    render: () => (
      <DumbbellQueue
        data={dumbbellQueueDemo}
        format={(v) => `${v}m`}
        references={[{ emphasis: "above", label: "6m", value: 6 }]}
        unit={0.25}
      />
    ),
  },
  {
    family: "basics",
    id: "R4",
    name: "Orchard yield and size",
    render: () => (
      <PlumbScatter
        data={plumbScatterDemo}
        format={(v) => `${v} t/ha`}
        formatX={(v) => `${v}k ha`}
        references={[{ emphasis: "above", label: "30 t/ha", value: 30 }]}
        xDomain={[0, 340]}
        xLabels={["Smaller", "Larger"]}
        xReferences={[{ from: 100, label: "100 to 200k ha", to: 200 }]}
        yLabel="Yield ↑"
      />
    ),
  },
  {
    family: "basics",
    id: "R5",
    name: "Orders ahead",
    render: () => (
      <HairlineArea
        data={forecastDemo}
        forecast={{ from: forecastFrom }}
        format={fmtInt}
        intervals={forecastIntervals}
        ticks={[0, 20, 40, 60, 80]}
      />
    ),
  },
  {
    family: "basics",
    id: "R6",
    name: "Households buying",
    render: () => (
      <RangeDots
        coverage={0.9}
        data={rangeDemo}
        domain={[0, 60]}
        format={percent}
        formatMargin={String}
        unitNote="Estimate and 90% interval"
        wide={15}
      />
    ),
  },
];

export const entries: GalleryEntry[] = [...f1, ...a, ...b, ...facets, ...marks];
