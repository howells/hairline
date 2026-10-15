/**
 * The numbers for the board: the Great Britain electricity system over the
 * two calendar years 2023 and 2024 (weeks run Monday to Sunday, 2 January 2023
 * to 29 December 2024, 104 of them; months are January 2023 to December 2024).
 * The weekly and monthly tables are in grid.json, the regional ones in
 * regions.json and the station list in stations.json, all in this folder.
 * Fetched 2026-10-15. Scripts: reference/scripts/board/.
 *
 * Sources
 *  - NESO, Historic Demand Data, half-hourly, 2023 and 2024 (NESO Open Data Licence):
 *    https://www.neso.energy/data-portal/historic-demand-data
 *    https://api.neso.energy/dataset/8f2fe0af-871c-488d-8bad-960426f24601/resource/bf5ab335-9b40-4ea4-b93a-ab4af7bce003/download/demanddata_2023.csv
 *    https://api.neso.energy/dataset/8f2fe0af-871c-488d-8bad-960426f24601/resource/f6d02c0f-957b-48cb-82ee-09003f2ba759/download/demanddata_2024.csv
 *  - Elexon Insights (BMRS), FUELHH, half-hourly generation by fuel, one request
 *    per calendar month (the API caps a query at 7 days, the stream endpoint
 *    allows longer). Contains BMRS data (c) Elexon Limited copyright and
 *    database right 2026. Licence: https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/
 *    https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom=2023-01-01&settlementDateTo=2023-01-31
 *    (and the same for each month to December 2024).
 *  - NESO Carbon Intensity API, national (CC BY 4.0), 14-day windows:
 *    https://api.carbonintensity.org.uk/intensity/2023-01-01T00:00Z/2023-01-15T00:00Z (and on to 2024-12-31)
 *    and regional (13-day windows, regions 1 to 14 only):
 *    https://api.carbonintensity.org.uk/regional/intensity/2023-01-01T00:00Z/2023-01-14T00:00Z (and on)
 *  - NESO, System Frequency, one-second data, one CSV per month, 2023 and 2024
 *    (the dataset page gives the statutory limit: 0.5 Hz either side of 50 Hz):
 *    https://www.neso.energy/data-portal/system-frequency-data
 *    e.g. https://api.neso.energy/dataset/cb1cc925-ecd8-4406-b021-3a3f368196e1/resource/5da35567-ca7f-4127-861c-cc07d488fd2d/download/fnew-2023-1.csv
 *  - DESNZ, DUKES 2026 table 5.6 (UK generation by fuel, 2024 column of the
 *    annual summaries; OGL v3):
 *    https://assets.publishing.service.gov.uk/media/6a6a3616862aaf18d9c629eb/DUKES_5.6.xlsx
 *  - DESNZ, DUKES 2026 table 5.11 (power stations, sheet "DUKES 2024", those
 *    operational at the end of May 2024; OGL v3):
 *    https://assets.publishing.service.gov.uk/media/6a6a365b0ddb7e4831c629f3/DUKES_5.11.xlsx
 *  - DESNZ, Energy Flow Chart 2024, terawatt hours (OGL v3):
 *    https://assets.publishing.service.gov.uk/media/6887aa04be2291b14d11b01d/Energy_Flow_Chart_TWh_2024.pdf
 *  - DESNZ and NESO, Clean Power 2030 Action Plan, main report and technical
 *    annex (annex, "Definition of Clean Power 2030": clean sources at least 95%
 *    of Great Britain's generation, so 5% from unabated gas in 2030):
 *    https://assets.publishing.service.gov.uk/media/6776727f6a79200ddfa21b81/clean-power-2030-action-plan-technical-annex.pdf
 *  - Met Office, past UK weather events (named storms of 2024):
 *    https://www.metoffice.gov.uk/weather/learn-about/past-uk-weather-events
 *    Storm Isha, 21 to 22 January 2024 (the note covers Jocelyn too, 23 to 24
 *    January); Storm Darragh, 6 to 7 December 2024 (red wind warning).
 *
 * Transforms
 *  - Energy in a week or month is the sum of half-hourly MW times 0.5 h, in GWh.
 *    FUELHH lacks 2023-07-17 period 45 and 2023-12-29 period 8; a bucket short
 *    of half-hours is scaled by expected over available, the expected count
 *    taken from the demand file.
 *  - demand is the demand file's ND (national demand, transmission-metered, so
 *    it leaves out embedded generation).
 *  - wind is FUELHH WIND plus the demand file's EMBEDDED_WIND_GENERATION.
 *  - solar is the demand file's EMBEDDED_SOLAR_GENERATION (an estimate).
 *  - gas is FUELHH CCGT plus OCGT; nuclear is NUCLEAR; imports is the sum of
 *    every INT* fuel type, net (negative when Great Britain exports).
 *  - other is BIOMASS, COAL, OIL, OTHER and NPSHYD, pumped storage while it
 *    generates (PS above zero), and the embedded solar estimate.
 *  - generation, where a share is taken, is gas + wind + nuclear + other: it
 *    leaves imports out, as the Action Plan's "generation" is read here.
 *  - ciMean and ciPeak are the mean and the highest of the national "actual"
 *    carbon intensity (g CO2 per kWh) over a week's half-hours (the forecast
 *    where actual is null: 5 half-hours). The API has gaps: 21 October 2023 is
 *    missing and four other days are short, so those weeks use fewer points.
 *  - freqMin is the lowest one-second frequency in the week (Hz); each monthly
 *    file was streamed and cut to a weekly minimum before the next was read.
 *  - Regional intensity is the API's per-half-hour forecast (the regional
 *    endpoint gives no actual): the mean for January 2023 and for December
 *    2024, and the mean by UTC hour of the day over both years.
 *  - Station age is 2024 minus Year Commissioned; Sour Gas is counted as Gas
 *    and Diesel/Gas Oil as Oil; stations of 100 MW or more only.
 *  - The flow chart's figures are read from the PDF's text layer (pdftotext -bbox).
 */

import grid from "./grid.json";
import regionTable from "./regions.json";
import stationTable from "./stations.json";

export interface Point {
  date: Date;
  value: number;
}

const DAY = 86_400_000;
const WEEK = 7 * DAY;

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Mondays from 2 Jan 2023 to 23 Dec 2024. */
export const WEEKS: Date[] = grid.weeks.map(utc);

/** First of each month, Jan 2023 – Dec 2024. */
export const MONTHS: Date[] = grid.months.map(utc);

/** Index of the week closest to an ISO date. */
export const weekIndex = (iso: string) =>
  Math.round((utc(iso).getTime() - WEEKS[0].getTime()) / WEEK);

/** Index of an ISO month ("2024-06") in MONTHS. */
export const monthIndex = (iso: string) =>
  MONTHS.findIndex((d) => d.toISOString().startsWith(iso));

const weekly = (values: number[]): Point[] =>
  WEEKS.map((date, i) => ({ date, value: values[i] }));

// ---------- Weekly series ----------

/** National demand a week, GWh. */
export const weeklyDemand = weekly(grid.weekly.demand);

/** Wind generation a week, GWh: transmission and embedded. */
export const weeklyWind = weekly(grid.weekly.wind);

/** Nuclear generation a week, GWh. */
export const weeklyNuclear = weekly(grid.weekly.nuclear);

/** Net imports on the interconnectors a week, GWh. */
export const weeklyImports = weekly(grid.weekly.imports);

/** Mean carbon intensity of a week, g CO2 per kWh. */
export const carbonMean = weekly(grid.weekly.ciMean);

/** Highest half-hourly carbon intensity of a week, g CO2 per kWh. */
export const carbonPeak = weekly(grid.weekly.ciPeak);

/** Lowest system frequency of a week, Hz. */
export const lowestFrequency = weekly(grid.weekly.freqMin);

/** The statutory limit: 0.5 Hz below 50 Hz, Hz. */
export const FREQUENCY_LIMIT = 49.5;

/** Weekly wind, change on the same week a year before, %: the 52 weeks of 2024. */
export const windYearOnYear: Point[] = WEEKS.slice(52).map((date, k) => ({
  date,
  value: (grid.weekly.wind[52 + k] / grid.weekly.wind[k] - 1) * 100,
}));

/** Two named storms of 2024 (Met Office), first day to last. */
export const STORMS = [
  { from: "2024-01-21", label: "Isha", to: "2024-01-22" },
  { from: "2024-12-06", label: "Darragh", to: "2024-12-07" },
].map((s) => ({ from: utc(s.from), label: s.label, to: utc(s.to) }));

/**
 * Weekly demand of 2024 from its second week to mid-December, and the same
 * weeks of 2023 set on 2024's dates: the holiday weeks at either end are left
 * out. The week k of 2023 is the week k + 52 of the table.
 */
const FIRST_OF_2024 = weekIndex("2024-01-08");
const YEAR_WEEKS = 50;
export const demand2024 = weeklyDemand.slice(
  FIRST_OF_2024,
  FIRST_OF_2024 + YEAR_WEEKS
);
export const demand2023 = weeklyDemand
  .slice(FIRST_OF_2024 - 52, FIRST_OF_2024 - 52 + YEAR_WEEKS)
  .map((p, i) => ({ date: demand2024[i].date, value: p.value }));

/** The 26 weeks of the second half of 2024. */
export const HALF_YEAR_WEEKS = WEEKS.slice(weekIndex("2024-07-01"));

/** Generation a week in the second half of 2024, GWh, by fuel. */
export const halfYearGeneration = (() => {
  const from = weekIndex("2024-07-01");
  const cut = (values: number[]) => values.slice(from);
  return {
    gas: cut(grid.weekly.gas),
    imports: cut(grid.weekly.imports),
    nuclear: cut(grid.weekly.nuclear),
    wind: cut(grid.weekly.wind),
  };
})();

// ---------- Monthly series (Jan 2023 – Dec 2024) ----------

const m = grid.monthly;

const toTWh = (gwh: number[]) => gwh.map((v) => v / 1000);

/** Generation a month by fuel, TWh. Other: biomass, coal, oil, hydro, storage, solar. */
export const monthlyGeneration = {
  gas: toTWh(m.gas),
  nuclear: toTWh(m.nuclear),
  other: toTWh(m.other),
  wind: toTWh(m.wind),
};

const generated = (i: number) =>
  m.gas[i] + m.nuclear[i] + m.other[i] + m.wind[i];

/** Each fuel's share of a month's generation, %. */
export const monthlyShare = {
  gas: m.gas.map((v, i) => (v / generated(i)) * 100),
  nuclear: m.nuclear.map((v, i) => (v / generated(i)) * 100),
  other: m.other.map((v, i) => (v / generated(i)) * 100),
  wind: m.wind.map((v, i) => (v / generated(i)) * 100),
};

/** Solar generation a month, TWh (embedded, estimated). */
export const monthlySolar = toTWh(m.solar);

/** Gas's share of generation the Clean Power 2030 Action Plan allows in 2030, %. */
export const GAS_PLAN_SHARE = 5;

/** Mean demand a day, by month, GWh. */
const dailyDemand = m.demand.map((v, i) => v / m.days[i]);

/** Month-on-month change in mean daily demand, %. Null: no month before it. */
export const demandChange: (number | null)[] = dailyDemand.map((v, i) =>
  i === 0 ? null : (v / dailyDemand[i - 1] - 1) * 100
);

// ---------- A year by fuel (DUKES 5.6, 2024) ----------

/** UK electricity generated in 2024 by fuel, all generating companies, TWh. */
export const fuelsIn2024 = [
  { name: "Gas", value: 87.409 },
  { name: "Wind", value: 83.631 },
  { name: "Nuclear", value: 40.588 },
  { name: "Bioenergy", value: 40.131 },
  { name: "Solar", value: 14.992 },
  { name: "Hydro", value: 5.731 },
  { name: "Coal", value: 2.04 },
  { name: "Oil", value: 1.741 },
];

// ---------- Regions ----------

const rounded = regionTable.map((r) => ({
  from: Math.round(r.jan2023),
  hourly: r.hourly,
  name: r.name,
  to: Math.round(r.dec2024),
}));

const byChange = rounded.toSorted((a, b) => a.to - a.from - (b.to - b.from));

/** Mean carbon intensity, January 2023 against December 2024: the five regions that fell most. */
export const cleanerRegions = byChange
  .slice(0, 5)
  .map(({ from, name, to }) => ({ from, name, to }));

/** The eight regions with the largest change either way, g CO2 per kWh. */
export const regionChange = [...byChange.slice(0, 4), ...byChange.slice(-4)]
  .map(({ from, name, to }) => ({ after: to, before: from, name }))
  .toSorted((a, b) => a.after - a.before - (b.after - b.before));

export const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Six regions, by name. */
const HEAT_REGIONS = [
  "North Scotland",
  "North West England",
  "East England",
  "London",
  "South West England",
  "South Wales",
];
export const HEAT_ROWS = HEAT_REGIONS;

/** Mean carbon intensity by region and UTC hour of the day, 2023 and 2024, g CO2 per kWh. */
export const hourlyIntensity: number[][] = HEAT_REGIONS.map((name) => {
  const region = rounded.find((r) => r.name === name);
  if (region === undefined) {
    throw new Error(`No region called ${name}`);
  }
  return region.hourly;
});

// ---------- Power stations ----------

export interface Station {
  name: string;
  fuel: string;
  /** Installed capacity, MW. */
  mw: number;
  /** Age at the end of 2024, years. */
  age: number;
}

/** Every station of 100 MW or more operational at the end of May 2024. */
export const stations: Station[] = stationTable.map((s) => ({
  age: 2024 - s.year,
  fuel: s.fuel,
  mw: s.mw,
  name: s.name,
}));

// ---------- Where the energy goes (Energy Flow Chart 2024, TWh) ----------

/**
 * Primary demand, 1,965.4 TWh, to final use. Conversion losses (286.0) and
 * energy industry use and distribution losses (137.9) drop out; final
 * consumption is the chart's 1,542.4 (the chart's own balance differs by 0.9
 * TWh, so the link into it carries 1,541.5, primary demand less the two
 * losses). Final consumption: transport 628.2, domestic 395.3, other final
 * consumers 239.2, industry 227.0 (iron and steel 10.0, other industry 217.0)
 * and non-energy use 52.7.
 */
export const energyFlow = {
  links: [
    { source: "demand", target: "final", value: 1541.5 },
    { source: "demand", target: "conversion", value: 286 },
    { source: "demand", target: "industryuse", value: 137.9 },
    { source: "final", target: "nonenergy", value: 52.7 },
    { source: "final", target: "transport", value: 628.2 },
    { source: "final", target: "domestic", value: 395.3 },
    { source: "final", target: "others", value: 239.2 },
    { source: "final", target: "industry", value: 227 },
  ],
  nodes: [
    { id: "demand", label: "Primary demand", stage: 0 },
    { id: "final", label: "Final consumption", stage: 1 },
    { alert: true, id: "conversion", label: "Conversion loss", stage: 1 },
    { id: "industryuse", label: "Own use and losses", stage: 1 },
    { id: "nonenergy", label: "Non-energy", stage: 2 },
    { id: "transport", label: "Transport", stage: 2 },
    { id: "domestic", label: "Domestic", stage: 2 },
    { id: "others", label: "Other users", stage: 2 },
    { id: "industry", label: "Industry", stage: 2 },
  ],
  stages: ["Supply, TWh", "Conversion", "Use"],
};
