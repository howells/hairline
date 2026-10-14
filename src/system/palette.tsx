import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  PALETTES,
  PaletteContext,
  readStoredPalette,
  storePalette,
  usePalette,
} from "./palette-state";
import type { PaletteId } from "./palette-state";

/** Owns the active palette, mirrors it onto <html data-palette> and remembers it. */
export const PaletteProvider = (props: { children: ReactNode }) => {
  const [palette, setPalette] = useState<PaletteId>(readStoredPalette);
  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    storePalette(palette);
  }, [palette]);
  const value = useMemo(() => ({ palette, setPalette }), [palette]);
  return <PaletteContext value={value}>{props.children}</PaletteContext>;
};

/**
 * Swap palettes as one cross-fade of the whole page (::view-transition rules in
 * app.css), so every chart changes colour together. The new palette goes onto
 * <html> inside the callback, which is when the browser takes its "after" picture.
 */
const swapPalette = (id: PaletteId, setPalette: (p: PaletteId) => void) => {
  const apply = () => {
    document.documentElement.dataset.palette = id;
    setPalette(id);
  };
  if ("startViewTransition" in document) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
};

export const PaletteSwitcher = () => {
  const { palette, setPalette } = usePalette();
  return (
    <fieldset className="m-0 flex gap-1 border-0 p-0">
      <legend className="sr-only">Palette</legend>
      {PALETTES.map((p) => (
        <label
          key={p.id}
          className="text-muted text-small hover:text-text has-checked:text-text has-focus-visible:outline-muted inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full px-2.5 transition-colors has-focus-visible:outline-1 has-focus-visible:outline-offset-2 has-focus-visible:outline-solid"
        >
          <input
            type="radio"
            name="palette"
            value={p.id}
            checked={palette === p.id}
            className="sr-only"
            onChange={() => {
              swapPalette(p.id, setPalette);
            }}
          />
          <span className="inline-flex" aria-hidden>
            {p.swatch.map((c) => (
              <span
                key={c}
                className="shadow-swatch first:shadow-ring -ml-0.75 size-2.25 rounded-full first:ml-0"
                style={{ background: c }}
              />
            ))}
          </span>
          <span className="max-sm:sr-only">{p.label}</span>
        </label>
      ))}
    </fieldset>
  );
};
