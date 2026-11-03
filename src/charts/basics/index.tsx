import type { GalleryEntry } from "../../gallery/types";
import { fmtGWh, fmtInt } from "../../lib/format";
import { Facets } from "../facets";
import { entries as a } from "./entries-a";
import { entries as b } from "./entries-b";
import { quarterlySeries, weeklySeries } from "./facets.data";
import { HairlineArea } from "./hairline-area";
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

export const entries: GalleryEntry[] = [...f1, ...a, ...b, ...facets];
