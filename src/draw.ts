/*
 * Which component draws which kind: the registry says what a chart is, this
 * table says how to draw one from a payload. The docs site and the acceptance
 * suite both draw through it, so a seventh chart is added here once.
 */
import { createElement } from "react";
import type { ComponentType, ReactElement } from "react";

import { DumbbellQueue } from "./charts/basics/dumbbell-queue";
import { HairlineArea } from "./charts/basics/hairline-area";
import { HairlineLine } from "./charts/basics/hairline-line";
import { PlumbScatter } from "./charts/basics/plumb-scatter";
import { RangeDots } from "./charts/basics/range-dots";
import { RungBars } from "./charts/basics/rung-bars";
import { Slope } from "./charts/board/slope";
import { charts } from "./schema/registry";
import type { ChartEntry } from "./schema/registry";
import type { Payload } from "./schema/validate";

/** Check a payload against the chart's registry entry, then draw it. */
const drawer = <T extends object>(
  entry: ChartEntry<T>,
  Component: ComponentType<T>
) =>
  function draw(payload: Payload, extra: Partial<T> = {}): ReactElement {
    const checked = entry.validate(payload);

    if (!checked.ok) {
      throw new Error(
        `${entry.kind}: ${checked.issues.map((issue) => `${issue.pointer} ${issue.message}`).join("; ")}`
      );
    }

    return createElement(Component, { ...checked.value, ...extra });
  };

/**
 * Every chart by kind: `drawers.slope(payload)` validates the payload and
 * returns the element, or throws with the issues. The second argument is
 * props a host adds to the payload (a first-render width, say).
 */
export const drawers = {
  "dumbbell-queue": drawer(charts["dumbbell-queue"], DumbbellQueue),
  "hairline-area": drawer(charts["hairline-area"], HairlineArea),
  "hairline-line": drawer(charts["hairline-line"], HairlineLine),
  "plumb-scatter": drawer(charts["plumb-scatter"], PlumbScatter),
  "range-dots": drawer(charts["range-dots"], RangeDots),
  "rung-bars": drawer(charts["rung-bars"], RungBars),
  slope: drawer(charts.slope, Slope),
};
