import { rnd } from "../../lib/random";

export interface WaveDatum {
  date: Date;
  value: number;
}

const START = Date.UTC(2026, 10, 2);
const DAY = 86_400_000;
/** 17 November: the Assistant launch. */
const LAUNCH = 15;
/** 24 to 26 December. */
const HOLIDAY = new Set([52, 53, 54]);

const signUps = (d: number, date: Date) => {
  const dow = date.getUTCDay();
  const weekend = dow === 0 || dow === 6 ? 0.62 : 1;
  const launch = d >= LAUNCH ? 3400 * Math.exp(-(d - LAUNCH) / 3.2) : 0;
  const holiday = HOLIDAY.has(d) ? 0.45 : 1;
  const base = 2450 + d * 9 + rnd(d, 17) * 320;
  return Math.round((base * weekend + launch) * holiday);
};

/** Fieldnote sign-ups a day, 2 November to 27 December 2026. */
export const staggerWaveDemo: WaveDatum[] = Array.from(
  { length: 56 },
  (_, d) => {
    const date = new Date(START + d * DAY);
    return { date, value: signUps(d, date) };
  }
);
