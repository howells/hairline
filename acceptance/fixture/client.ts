// The browser half: hydrate the server HTML with the config the page carries.
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";

import { Deck, deckConfigSchema } from "./deck.ts";

const config = deckConfigSchema.parse(
  JSON.parse(document.querySelector("#config")?.textContent ?? "{}")
);

const root = document.querySelector("#root");

if (root) {
  hydrateRoot(root, createElement(Deck, config));
}
