import type { SlopeProps } from "../../schema/slope";
import { Chart } from "../core";
import { Slope } from "./slope";

/**
 * The board's frame around the bare Slope: the panel, measured to the
 * container, with the plot drawn at the width it finds.
 */
export const SlopeCard = (
  props: Omit<SlopeProps, "initialWidth" | "width">
) => <Chart>{(width) => <Slope {...props} width={width} />}</Chart>;
