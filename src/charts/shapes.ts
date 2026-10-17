/*
 * Shape geometry shared by the marks: the outline of a bar with its rounded
 * outer end.
 */

export type CapDirection = "down" | "left" | "right" | "up";

/** Corner radius of a bar's outer end: small cells on the radius scale. */
export const BAR_RADIUS = 2;

/**
 * A bar: square at the base, squared at the outer end with a 2px
 * corner. `dir` is the direction the bar grows from its base. A bar shorter
 * than its corner gets a smaller one.
 */
export const barPath = (
  x: number,
  y: number,
  w: number,
  h: number,
  dir: CapDirection
) => {
  if (w <= 0 || h <= 0) {
    return "";
  }
  const r = Math.min(BAR_RADIUS, w / 2, h / 2);
  if (dir === "up") {
    return `M${x},${y + h}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h}Z`;
  }
  if (dir === "down") {
    return `M${x},${y}V${y + h - r}A${r},${r} 0 0 0 ${x + r},${y + h}H${x + w - r}A${r},${r} 0 0 0 ${x + w},${y + h - r}V${y}Z`;
  }
  if (dir === "right") {
    return `M${x},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x}Z`;
  }
  return `M${x + w},${y}H${x + r}A${r},${r} 0 0 0 ${x},${y + r}V${y + h - r}A${r},${r} 0 0 0 ${x + r},${y + h}H${x + w}Z`;
};
