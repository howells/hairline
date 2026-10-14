import type { Point } from "../../lib/data";

export interface Threshold {
  value: number;
  label?: string;
  /** Paint the series red at its worst breach of the threshold. */
  alert?: "below" | "above";
}

/** Whether a value sits on the alert side of the threshold. */
export const isAlert = (th: Threshold | undefined, v: number) => {
  if (th?.alert === "below") {
    return v < th.value;
  }
  if (th?.alert === "above") {
    return v > th.value;
  }
  return false;
};

/** How far past the threshold a value is (0 when on the safe side). */
const breach = (th: Threshold, v: number) =>
  th.alert === "below" ? th.value - v : v - th.value;

/** The run of alert-side points around the single worst breach, if any. */
export const worstRun = (
  th: Threshold | undefined,
  data: Point[]
): [number, number] | null => {
  if (th?.alert === undefined) {
    return null;
  }
  let worst = -1;
  for (const [i, d] of data.entries()) {
    const deeper =
      worst < 0 || breach(th, d.value) > breach(th, data[worst].value);
    if (isAlert(th, d.value) && deeper) {
      worst = i;
    }
  }
  if (worst < 0) {
    return null;
  }
  let a = worst;
  while (a > 0 && isAlert(th, data[a - 1].value)) {
    a -= 1;
  }
  let b = worst;
  while (b < data.length - 1 && isAlert(th, data[b + 1].value)) {
    b += 1;
  }
  return [a, b];
};

export const inRun = (run: [number, number] | null, i: number) =>
  run !== null && i >= run[0] && i <= run[1];
