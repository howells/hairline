import type { ReactNode } from "react";

/**
 * The one place a glance chart's controls sit (CONTROL_SLOT_H tall, in
 * util-b): a 44px row at the top left,
 * above the plot, the pills flush with the chart's left edge.
 */
export const ControlSlot = (props: { children: ReactNode }) => (
  <div className="flex h-11 items-center gap-1">{props.children}</div>
);
