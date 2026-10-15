import { format } from "d3-format";
import { utcFormat } from "d3-time-format";

export const fmtInt = format(",.0f");
export const fmtMs = (v: number) => `${fmtInt(v)} ms`;
export const fmtK = (v: number) => `${format(".1f")(v / 1000)}k`;
export const fmtKInt = (v: number) => `${fmtInt(v / 1000)}k`;

/**
 * Money in the house style: lowercase k and m, no space, and only the decimals
 * the magnitude needs ($940, $512k, $8.92m, $18.4m). Every chart uses this.
 */
export const fmtMoney = (v: number) => {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e6) {
    const m = a / 1e6;
    return `${sign}$${m >= 10 ? m.toFixed(1) : m.toFixed(2)}m`.replace(
      /\.?0+m$/u,
      "m"
    );
  }
  if (a >= 1e3) {
    return `${sign}$${Math.round(a / 1e3)}k`;
  }
  return `${sign}$${Math.round(a)}`;
};

/** A price to the cent, in the same house style ($21.30, −$0.45). */
export const fmtPrice = (v: number) =>
  `${v < 0 ? "−" : ""}$${Math.abs(v).toFixed(2)}`;

/** Signed percent with a true minus sign: +4%, −10%, 0%. */
export const fmtSignedPct = (v: number, digits = 0) =>
  v === 0 ? "0%" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}%`;

/** Signed delta with a true minus sign: +31 ms, −41 ms. */
export const fmtSignedMs = (v: number) =>
  `${v > 0 ? "+" : "−"}${Math.abs(Math.round(v))} ms`;

const monthYear = utcFormat("%b %Y");
const dayMonthYear = utcFormat("%-d %b %Y");
export const fmtMonth = (d: Date) => monthYear(d);
export const fmtDay = (d: Date) => dayMonthYear(d);

const monthOnly = utcFormat("%b");
const yearOnly = utcFormat("%Y");
const yearShort = utcFormat("%y");

/**
 * Month ticks in the broadsheet style: the year is printed on the first tick
 * and wherever it changes, nowhere else ("Jul 2024 · Jan 2025 · Jul · Jan 2026").
 */
export const monthTickLabels = (dates: readonly Date[]) =>
  dates.map((d, i) => {
    const prev = dates[i - 1];
    const newYear =
      prev === undefined || prev.getUTCFullYear() !== d.getUTCFullYear();
    return newYear ? monthYear(d) : monthOnly(d);
  });

/**
 * Year ticks in the broadsheet style: the first year in full and later years
 * abbreviated, except at a new century ("2000 05 10 15").
 */
export const yearTickLabels = (dates: readonly Date[]) =>
  dates.map((d, i) =>
    i === 0 || d.getUTCFullYear() % 100 === 0 ? yearOnly(d) : yearShort(d)
  );

const dayAndMonth = utcFormat("%-d %b");
const dayOnly = utcFormat("%-d");

/**
 * Day ticks in the broadsheet style: the month is printed on the first tick
 * and wherever it changes, nowhere else ("24 Aug · 31 · 7 Sep · 14").
 */
export const dayTickLabels = (dates: readonly Date[]) =>
  dates.map((d, i) => {
    const prev = dates[i - 1];
    const newMonth =
      prev === undefined ||
      prev.getUTCMonth() !== d.getUTCMonth() ||
      prev.getUTCFullYear() !== d.getUTCFullYear();
    return newMonth ? dayAndMonth(d) : dayOnly(d);
  });

/** Temperature in degrees Celsius to one decimal place ("12.3 °C", "−2.2 °C"). */
export const fmtDegC = (v: number) => {
  const t = Math.abs(v).toFixed(1);
  return `${v < 0 && t !== "0.0" ? "−" : ""}${t} °C`;
};

/** Mains frequency as published, to three decimal places ("49.275 Hz"). */
export const fmtHz = (v: number) => `${v.toFixed(3)} Hz`;

/** Carbon intensity, grams of CO₂ per kilowatt hour, whole grams ("142 g/kWh"). */
export const fmtGCO2 = (v: number) => `${fmtInt(v)} g/kWh`;

/** Signed change in carbon intensity with a true minus sign ("−85 g/kWh", "+12 g/kWh"). */
export const fmtSignedGCO2 = (v: number) =>
  `${v > 0 ? "+" : "−"}${fmtInt(Math.abs(v))} g/kWh`;

/** Energy in gigawatt hours, whole ("3,521 GWh"). */
export const fmtGWh = (v: number) => `${fmtInt(v)} GWh`;

/** Energy in terawatt hours (the input is TWh), to one decimal place ("87.4 TWh"). */
export const fmtTWh = (v: number) => `${v.toFixed(1)} TWh`;
