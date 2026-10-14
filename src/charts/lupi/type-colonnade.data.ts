/** One owned thing and who owns it. */
export interface OwnershipDatum {
  name: string;
  owner: string;
}

/** Fieldnote's repositories by owning team. */
const owned: [string, string[]][] = [
  [
    "Platform",
    [
      "api",
      "api-gateway",
      "auth",
      "auth-sdk",
      "export",
      "notify",
      "notify-worker",
      "search",
      "search-index",
      "sync",
      "sync-engine",
    ],
  ],
  [
    "Infra",
    [
      "backups",
      "ci-runners",
      "deploy",
      "dns-config",
      "edge",
      "metrics",
      "queue",
    ],
  ],
  [
    "Product",
    ["canvas", "canvas-web", "clips", "clips-extension", "editor", "templates"],
  ],
  [
    "Mobile",
    ["app-android", "app-ios", "mobile-kit", "sync-mobile", "widgets"],
  ],
  ["Data", ["assistant", "assistant-eval", "events", "warehouse"]],
  ["Growth", ["billing", "onboarding", "site"]],
  ["Design", ["design-tokens"]],
  ["Support", ["help-center"]],
];

/** 38 repos, listed alphabetically as the code host shows them. */
export const typeColonnadeDemo: OwnershipDatum[] = owned
  .flatMap(([owner, repos]) => repos.map((name) => ({ name, owner })))
  .toSorted((a, b) => a.name.localeCompare(b.name));
