import { mulberry32 } from "../../lib/random";

/** One data path: where a stream starts, what processes it, where it lands. */
export interface ThreadPath {
  destination: string;
  id: string;
  processor: string;
  source: string;
}

export interface TriptychData {
  /** Column order, top to bottom. */
  destinations: string[];
  paths: ThreadPath[];
  processors: string[];
  sources: string[];
}

/** Fieldnote's services, the steps each runs, and the stores each mostly writes to. */
const SERVICES = [
  {
    name: "api",
    steps: ["route", "validate", "throttle"],
    stores: ["Event log", "Note store"],
  },
  {
    name: "auth",
    steps: ["verify", "scope", "redact"],
    stores: ["Event log", "Metrics"],
  },
  {
    name: "sync",
    steps: ["diff", "merge", "version", "compact"],
    stores: ["Note store", "Backups"],
  },
  {
    name: "clips",
    steps: ["fetch", "parse", "ocr", "dedupe"],
    stores: ["File store", "Note store"],
  },
  {
    name: "search",
    steps: ["tokenise", "rank", "index"],
    stores: ["Search index"],
  },
  {
    name: "assistant",
    steps: ["chunk", "embed", "summarise"],
    stores: ["Vector index", "Note store"],
  },
  { name: "canvas", steps: ["layout", "render"], stores: ["File store"] },
  { name: "export", steps: ["convert", "bundle"], stores: ["File store"] },
  { name: "billing", steps: ["meter", "invoice"], stores: ["Ledger", "Inbox"] },
  {
    name: "notify",
    steps: ["digest", "fan-out", "schedule"],
    stores: ["Inbox", "Metrics"],
  },
];

/** Where data enters, and the services each input feeds. */
const INPUTS = [
  { name: "Web editor", services: ["sync", "canvas", "api", "search"] },
  { name: "Desktop editor", services: ["sync", "canvas", "search"] },
  { name: "iOS editor", services: ["sync", "api", "search"] },
  { name: "Android editor", services: ["sync", "search"] },
  { name: "Web clipper", services: ["clips", "search"] },
  { name: "Share sheet", services: ["clips", "sync"] },
  { name: "Public API", services: ["api", "auth", "export"] },
  { name: "Google Drive", services: ["clips", "search", "assistant"] },
  { name: "Dropbox", services: ["clips", "search"] },
  { name: "Notion import", services: ["sync", "search", "assistant"] },
  { name: "Readwise", services: ["clips", "search"] },
  { name: "Zotero", services: ["clips", "search"] },
  { name: "Figma", services: ["clips", "canvas"] },
  { name: "GitHub", services: ["api", "search"] },
  { name: "Linear", services: ["api", "notify"] },
  { name: "Slack", services: ["notify", "assistant", "clips"] },
  { name: "Zoom", services: ["assistant", "clips"] },
  { name: "Calendar", services: ["notify", "sync"] },
  { name: "Email", services: ["clips", "search", "notify"] },
  { name: "Voice memos", services: ["assistant", "clips"] },
  { name: "Doc scanner", services: ["clips", "assistant"] },
  { name: "Sign-ins", services: ["auth"] },
  { name: "Payments", services: ["billing", "auth"] },
  { name: "App events", services: ["api", "notify", "auth"] },
];

const STORES = [
  "Note store",
  "Search index",
  "Vector index",
  "File store",
  "Event log",
  "Metrics",
  "Ledger",
  "Inbox",
  "Backups",
];

/** 24 inputs → Fieldnote's service steps → 9 stores, one thread per data path. */
export const threadTriptychDemo: TriptychData = (() => {
  const rand = mulberry32(19);
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  const steps = SERVICES.flatMap((s) =>
    s.steps.map((step) => ({ id: `${s.name}/${step}`, service: s }))
  );
  const paths: ThreadPath[] = [];
  const seen = new Map<string, number>();
  for (const input of INPUTS) {
    const own = steps.filter((s) => input.services.includes(s.service.name));
    const count = 3 + Math.floor(rand() * 4);
    for (let k = 0; k < count; k += 1) {
      const step = rand() < 0.9 ? pick(own) : pick(steps);
      // Each step writes mostly to its service's stores, now and then elsewhere.
      const destination =
        rand() < 0.88 ? pick(step.service.stores) : pick(STORES);
      const route = `${input.name}>${step.id}>${destination}`;
      const n = (seen.get(route) ?? 0) + 1;
      seen.set(route, n);
      paths.push({
        destination,
        id: `${route}#${n}`,
        processor: step.id,
        source: input.name,
      });
    }
  }
  return {
    destinations: STORES,
    paths,
    // Only the steps some path runs through, in service order.
    processors: steps.flatMap((s) =>
      paths.some((p) => p.processor === s.id) ? [s.id] : []
    ),
    sources: INPUTS.map((i) => i.name),
  };
})();
