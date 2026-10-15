import { paint } from "../texture-ids";

export interface StepFill {
  className: string;
  fill?: string;
}

/** Fill for a shade step under the pattern id prefix `pid`; −1 (no value) is bare paper. */
export const stepFill = (bin: number, pid: string): StepFill => {
  if (bin < 0) {
    return { className: "fill-paper" };
  }
  return { className: "", fill: paint(`${pid}-${bin}`) };
};
