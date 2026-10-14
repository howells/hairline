/** A step adds or removes `value`; a total draws the running level from the floor (its `value` is optional). */
export interface WaterfallDatum {
  label: string;
  total?: boolean;
  value?: number;
}

/** Fieldnote's September 2026 revenue ($k), from billed to margin. */
export const rungWaterfallDemo: WaterfallDatum[] = [
  { label: "Billed", total: true, value: 1550 },
  { label: "Refunds", value: -150 },
  { label: "Hosting", value: -400 },
  { label: "AI models", value: -300 },
  { label: "Margin", total: true },
];
