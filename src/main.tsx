import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { PaletteProvider } from "./system/palette";

import "./system/app.css";

const root = document.querySelector("#root");
if (root === null) {
  throw new Error("Missing #root element");
}

createRoot(root).render(
  <StrictMode>
    <PaletteProvider>
      <App />
    </PaletteProvider>
  </StrictMode>
);
