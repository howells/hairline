import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";

/** What a daily chart draws when there is nothing to draw: a quiet axis. */
export const DailyEmpty = ({
  floor,
  height,
  title,
  width,
}: {
  floor: number;
  height: number;
  title?: string;
  width: number;
}) => (
  <ChartSvg height={height} label={title ?? "No data"} width={width}>
    <HRule x0={8} x1={width - 8} y={floor} />
    <Label anchor="middle" voice="axis" x={width / 2} y={floor - 12}>
      No data
    </Label>
  </ChartSvg>
);
