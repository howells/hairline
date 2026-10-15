import type { GalleryEntry } from "../../gallery/types";
import { BOARD_PRESETS } from "./presets";

/** A board id's number: "D12" → 12. */
const boardNumber = (id: string) => Number(id.slice(1));

/** Gallery entries for the grid boards, in numeric order D1–D19. */
export const entries: GalleryEntry[] = Object.entries(BOARD_PRESETS)
  .toSorted(([a], [b]) => boardNumber(a) - boardNumber(b))
  .map(([id, p]) => ({
    family: "board",
    id,
    name: p.name,
    render: p.render,
  }));
