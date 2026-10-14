import { mulberry32 } from "../../lib/random";

export interface GalaxyNode {
  /** Domain (cluster) the node belongs to. */
  domain: string;
  /** The domain's hub: labelled, larger, anchors its satellites. */
  hub?: boolean;
  id: string;
  /** Size measure, e.g. calls per minute. Drives the dot area. */
  volume: number;
}

export interface GalaxyLink {
  source: string;
  target: string;
  /** Relative traffic; drives the hub-to-hub line weight. */
  weight?: number;
}

export interface GalaxyData {
  links: GalaxyLink[];
  nodes: GalaxyNode[];
}

/**
 * Fieldnote's services, busiest first: each is a hub with its endpoints and
 * workers around it. Sync carries the most calls.
 */
const SERVICES = [
  { calls: 3120, name: "sync", parts: 22 },
  { calls: 2860, name: "api", parts: 21 },
  { calls: 2290, name: "search", parts: 19 },
  { calls: 1940, name: "auth", parts: 16 },
  { calls: 1610, name: "clips", parts: 17 },
  { calls: 1380, name: "canvas", parts: 15 },
  { calls: 1060, name: "assistant", parts: 16 },
  { calls: 820, name: "notify", parts: 14 },
  { calls: 590, name: "export", parts: 12 },
  { calls: 410, name: "billing", parts: 12 },
];

/** What a service's satellites do; numbered when a service runs several. */
const ROLES = [
  "worker",
  "reader",
  "writer",
  "queue",
  "cache",
  "cron",
  "webhook",
  "replica",
  "batch",
  "stream",
];

/** Service-to-service traffic: api fronts most calls, sync talks to the editors' services. */
const MESH = [
  { a: "api", b: "sync", w: 3 },
  { a: "api", b: "auth", w: 3 },
  { a: "api", b: "search", w: 3 },
  { a: "api", b: "clips", w: 2 },
  { a: "api", b: "canvas", w: 2 },
  { a: "api", b: "export", w: 1 },
  { a: "api", b: "billing", w: 1 },
  { a: "sync", b: "canvas", w: 3 },
  { a: "sync", b: "search", w: 2 },
  { a: "sync", b: "notify", w: 2 },
  { a: "sync", b: "auth", w: 2 },
  { a: "search", b: "assistant", w: 2 },
  { a: "search", b: "clips", w: 2 },
  { a: "assistant", b: "clips", w: 1 },
  { a: "export", b: "canvas", w: 1 },
  { a: "billing", b: "notify", w: 1 },
  { a: "billing", b: "auth", w: 2 },
];

/** 174 services in ten domains: each domain a hub plus satellites, a few calls across. */
export const forceGalaxyDemo: GalaxyData = (() => {
  const rand = mulberry32(53);
  const nodes: GalaxyNode[] = [];
  const links: GalaxyLink[] = [];
  for (const service of SERVICES) {
    nodes.push({
      domain: service.name,
      hub: true,
      id: service.name,
      volume: service.calls,
    });
    for (let k = 0; k < service.parts; k += 1) {
      const round = Math.floor(k / ROLES.length);
      const id = `${service.name}-${ROLES[k % ROLES.length]}${round === 0 ? "" : `-${round + 1}`}`;
      nodes.push({
        domain: service.name,
        id,
        volume: Math.round(12 + rand() ** 2 * 310),
      });
      links.push({ source: service.name, target: id, weight: 1 });
    }
  }
  for (const m of MESH) {
    links.push({ source: m.a, target: m.b, weight: m.w });
  }
  // A few satellites also call a foreign hub.
  const satellites = nodes.filter((n) => n.hub !== true);
  const seen = new Set<string>();
  for (let k = 0; k < 22; k += 1) {
    const s = satellites[Math.floor(rand() * satellites.length)];
    const others = SERVICES.filter((d) => d.name !== s.domain);
    const target = others[Math.floor(rand() * others.length)].name;
    if (!seen.has(`${s.id}~${target}`)) {
      seen.add(`${s.id}~${target}`);
      links.push({ source: s.id, target, weight: 0.5 });
    }
  }
  return { links, nodes };
})();
