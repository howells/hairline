/** Progress toward a target, in any unit. */
export interface TickGaugeDatum {
  target: number;
  value: number;
}

/** Fieldnote's annual recurring revenue ($m) in October 2026, against the year's $20m goal. */
export const tickGaugeDemo: TickGaugeDatum = { target: 20, value: 16.4 };
