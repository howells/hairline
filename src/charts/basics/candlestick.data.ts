import { rnd } from "../../lib/random";
import { dayAfter } from "./util-a";

/** One trading day. */
export interface CandleDatum {
  close: number;
  date: Date;
  high: number;
  low: number;
  open: number;
}

/**
 * F17 Daily price. Synthetic, not real market data: no official source
 * publishes open, high, low and close for each day, so this is a made-up run
 * of daily [open, close] pairs for six trading weeks from Monday 24 August
 * 2026: a climb, a sharp fall, and a recovery to new highs. The highs and lows
 * are open and close pushed out by a seeded pseudo-random amount. Prices
 * carry no unit.
 */
const OPEN_CLOSE = [
  [15.2, 15.6],
  [15.6, 15.3],
  [15.3, 15.9],
  [15.9, 16.4],
  [16.4, 16.2],
  [16.2, 16.8],
  [16.8, 17.3],
  [17.3, 17.1],
  [17.1, 17.8],
  [17.8, 18.4],
  [18.4, 18.9],
  [18.9, 19.6],
  [19.4, 17.2],
  [17, 16.1],
  [16.1, 15.4],
  [15.4, 14.8],
  [14.8, 15.1],
  [15.1, 14.6],
  [14.6, 15.3],
  [15.3, 15.9],
  [15.9, 16.7],
  [16.7, 17.4],
  [17.4, 17.2],
  [17.2, 18.1],
  [18.1, 18.6],
  [18.6, 19.3],
  [19.3, 19],
  [19, 19.8],
  [19.8, 20.4],
  [20.4, 21.1],
];

const tenth = (v: number): number => Math.round(v * 10) / 10;

/** A made-up price, daily, 24 August to 2 October 2026 (see above). */
export const candlestickDemo: CandleDatum[] = OPEN_CLOSE.map(
  ([open = 0, close = 0], i) => ({
    close,
    // Five trading days, then the weekend.
    date: dayAfter("2026-08-24", i + Math.floor(i / 5) * 2),
    high: tenth(Math.max(open, close) + 0.2 + rnd(i, 1) * 0.8),
    low: tenth(Math.min(open, close) - 0.2 - rnd(i, 2) * 0.8),
    open,
  })
);
