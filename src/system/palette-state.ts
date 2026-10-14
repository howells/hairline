import { createContext, useContext } from "react";

/** The three modes: the same ink on three papers. */
export const PALETTES = [
  { id: "paper", label: "Paper", swatch: ["#fbfbf9", "#1d1d1b", "#9f9e9a"] },
  { id: "pink", label: "Pink", swatch: ["#f1dfdc", "#27201e", "#a59895"] },
  { id: "dark", label: "Dark", swatch: ["#181715", "#f0eeeb", "#686663"] },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

interface PaletteState {
  palette: PaletteId;
  setPalette: (p: PaletteId) => void;
}

export const PaletteContext = createContext<PaletteState>({
  palette: "paper",
  setPalette: () => {
    // Replaced by the provider.
  },
});

export const usePalette = () => useContext(PaletteContext);

const STORAGE_KEY = "hairline.palette";

const isPaletteId = (value: string | null): value is PaletteId =>
  PALETTES.some((p) => p.id === value);

/** The mode chosen on a previous visit, or Paper. */
export const readStoredPalette = (): PaletteId => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isPaletteId(stored) ? stored : "paper";
};

export const storePalette = (palette: PaletteId) => {
  window.localStorage.setItem(STORAGE_KEY, palette);
};
