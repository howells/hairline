import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import { REACH, nextByKey } from "./network-steps";

/** The ring a focused chart draws, in the one tone every focusable svg uses. */
export const FOCUS_RING =
  "focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-muted focus-visible:outline-solid";

interface Binding {
  /** The node at a point, within `reach` px of its edge, or null. */
  find: (x: number, y: number, reach: number) => string | null;
  /** The chart's height, for reading the pointer back in chart pixels. */
  height: number;
  /** Every node, in the order the arrow keys step through them. */
  ids: readonly string[];
  /** A press and release on no node: the chart's own click on empty space. */
  onEmptyTap?: () => void;
  /** A node held by a drag: it stays selected and the pointer picks nothing else. */
  held?: string | null;
  width: number;
}

/**
 * Which node is selected, by mouse hover, a tap or the arrow keys. `preselected`
 * is the node selected until the pointer or keys choose another; a mouse
 * leaving the chart gives it back. A tap on a node holds it until a tap on
 * empty space or another node. `chosen` is true once the pointer or keys have
 * chosen, so a tooltip can wait for that rather than sit on the preselected node.
 */
export const useNodeSelection = (preselected: string | undefined) => {
  // undefined: nothing chosen, so the preselected node; null: chosen empty.
  const [live, setLive] = useState<string | null | undefined>();
  const touch = useRef(false);
  const selected = live === undefined ? (preselected ?? null) : live;

  const bind = (b: Binding) => {
    const at = (e: PointerEvent<SVGSVGElement>) => {
      const box = e.currentTarget.getBoundingClientRect();

      return {
        x: (e.clientX - box.left) * (b.width / box.width),
        y: (e.clientY - box.top) * (b.height / box.height),
      };
    };

    return {
      leave: () => {
        if (!touch.current && (b.held ?? null) === null) {
          setLive(undefined);
        }
      },
      svg: {
        onKeyDown: (e: KeyboardEvent<SVGSVGElement>) => {
          const next = nextByKey(e.key, b.ids, selected);

          if (next !== undefined && b.ids.length > 0) {
            e.preventDefault();
            setLive(next ?? undefined);
          }
        },
        onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
          touch.current = e.pointerType === "touch";

          if (touch.current) {
            const p = at(e);
            setLive(b.find(p.x, p.y, REACH.touch));
          }
        },
        onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
          touch.current = e.pointerType === "touch";

          if (touch.current || (b.held ?? null) !== null) {
            return;
          }

          const p = at(e);
          setLive(b.find(p.x, p.y, REACH.mouse) ?? undefined);
        },
        onPointerUp: (e: PointerEvent<SVGSVGElement>) => {
          const p = at(e);

          if (
            b.find(
              p.x,
              p.y,
              e.pointerType === "touch" ? REACH.touch : REACH.mouse
            ) === null
          ) {
            b.onEmptyTap?.();
          }
        },
        tabIndex: 0,
      },
    };
  };

  return { bind, chosen: live !== undefined, selected };
};
