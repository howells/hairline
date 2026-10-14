import { quantileSorted } from "d3-array";

import { normals } from "../util";

/** First-response times for one support channel, as percentiles in minutes. */
export interface ChannelTimes {
  channel: string;
  /** 5th, 10th, 20th … 90th, 95th percentiles; the median is index 5. */
  q: number[];
}

/** The percentiles kept: the 5–95 span, and every tenth between. */
export const LEVELS = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
export const MEDIAN = 5;

interface Channel {
  channel: string;
  /** Median first response, minutes. */
  median: number;
  seed: number;
  /** Log-scale spread. */
  spread: number;
}

const CHANNELS: Channel[] = [
  { channel: "Chat", median: 4, seed: 41, spread: 0.72 },
  { channel: "Enterprise", median: 22, seed: 42, spread: 0.62 },
  { channel: "Social", median: 48, seed: 43, spread: 0.98 },
  { channel: "Email", median: 156, seed: 44, spread: 0.86 },
  { channel: "Community", median: 330, seed: 45, spread: 1.1 },
];

/** Fieldnote support, first response by channel, 2026. */
export const responseTimes: ChannelTimes[] = CHANNELS.map((c) => {
  const sample = normals(c.seed, 800, Math.log(c.median), c.spread)
    .map((v) => Math.exp(v))
    .toSorted((a, b) => a - b);
  return {
    channel: c.channel,
    q: LEVELS.map((p) => quantileSorted(sample, p) ?? 0),
  };
});
