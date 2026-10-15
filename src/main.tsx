import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { PaletteProvider } from "./system/palette";
import { installTouchHover } from "./system/touch-hover";

import "./system/app.css";

const root = document.querySelector("#root");
if (root === null) {
  throw new Error("Missing #root element");
}

installTouchHover();

/** Longest the boot plate waits for Inter before drawing with the fallback. */
const FONT_WAIT_MS = 2500;

let rendered = false;

/** Replaces the boot plate in index.html with the whole page in one frame. */
const render = () => {
  if (rendered) {
    return;
  }
  rendered = true;
  createRoot(root).render(
    <StrictMode>
      <PaletteProvider>
        <App />
      </PaletteProvider>
    </StrictMode>
  );
};

// Draw once Inter is in, in both weights the page sets, so no label or caption
// reflows after it is shown; a slow font network falls back after the wait.
setTimeout(render, FONT_WAIT_MS);
try {
  await Promise.all([
    document.fonts.load("400 13.5px Inter"),
    document.fonts.load("600 13.5px Inter"),
  ]);
} finally {
  render();
}
