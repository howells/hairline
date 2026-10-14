import type { GalleryEntry } from "../../gallery/types";
import { entries as a } from "./entries-a";
import { entries as b } from "./entries-b";

/** Gallery entries for the lupi family, in catalogue order. */
export const entries: GalleryEntry[] = [...a, ...b];
