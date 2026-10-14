import { mulberry32 } from "../../lib/random";

export interface RingNode {
  /** Group the node belongs to; groups sit together on the ring. */
  group: string;
  /** Unique id, also the label, e.g. "sync-engine". */
  id: string;
  /** Size measure (contributors); drives the dot area. */
  size: number;
}

export interface RingLink {
  source: string;
  target: string;
  /** Contributors the two repos share. */
  weight: number;
}

export interface RingData {
  links: RingLink[];
  nodes: RingNode[];
}

/**
 * Fieldnote's repos by owning team, each team's two biggest first. The
 * platform repos draw the most contributors.
 */
const TEAMS = [
  {
    name: "Product",
    repos: [
      "editor",
      "notes-web",
      "canvas",
      "templates",
      "comments",
      "calendar-view",
      "share-ui",
      "tag-picker",
    ],
  },
  {
    name: "Platform",
    repos: [
      "sync-engine",
      "api-gateway",
      "auth",
      "search-index",
      "clips-service",
      "export-service",
      "notify",
      "billing",
    ],
  },
  {
    name: "Growth",
    repos: [
      "onboarding",
      "pricing",
      "referrals",
      "newsletter",
      "experiments",
      "lifecycle-mail",
      "landing",
    ],
  },
  {
    name: "Data",
    repos: [
      "event-pipeline",
      "metrics",
      "dashboards",
      "embeddings",
      "assistant-evals",
      "ab-stats",
      "cohorts",
    ],
  },
  {
    name: "Design",
    repos: [
      "design-system",
      "icons",
      "type-scale",
      "figma-tokens",
      "illustration",
      "motion-kit",
      "docs-site",
    ],
  },
  {
    name: "Support",
    repos: [
      "help-centre",
      "support-bot",
      "status-page",
      "ticket-tools",
      "macros",
      "feedback-inbox",
    ],
  },
  {
    name: "Infra",
    repos: [
      "terraform",
      "k8s-config",
      "ci-runners",
      "observability",
      "backups",
      "edge-proxy",
      "secrets",
      "cost-reports",
    ],
  },
  {
    name: "Mobile",
    repos: [
      "ios-app",
      "android-app",
      "desktop-app",
      "share-extension",
      "widgets",
      "mobile-sync",
      "offline-store",
      "push-kit",
      "release-tools",
    ],
  },
];

/** Contributors per repo: two big repos per team, the rest small. */
const repoSize = (k: number, rand: () => number) => {
  if (k === 0) {
    return 31 + Math.round(rand() * 9);
  }
  if (k === 1) {
    return 19 + Math.round(rand() * 7);
  }
  return 3 + Math.round(rand() * 13);
};

const makeNodes = (rand: () => number): RingNode[] =>
  TEAMS.flatMap((team) =>
    team.repos.map((id, k) => ({
      group: team.name,
      id,
      size: repoSize(k, rand) + (team.name === "Platform" ? 7 : 0),
    }))
  );

const makeLinks = (nodes: RingNode[], rand: () => number): RingLink[] => {
  const seen = new Set<string>();
  const links: RingLink[] = [];
  const add = (a: RingNode, b: RingNode, weight: number) => {
    const key = a.id < b.id ? `${a.id}~${b.id}` : `${b.id}~${a.id}`;
    if (a.id === b.id || seen.has(key)) {
      return;
    }
    seen.add(key);
    links.push({ source: a.id, target: b.id, weight });
  };
  const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
  // Each team's biggest repo, listed first.
  const leads = new Map<string, RingNode>();
  for (const n of nodes) {
    if (!leads.has(n.group)) {
      leads.set(n.group, n);
    }
  }
  for (const node of nodes) {
    const team = nodes.filter((n) => n.group === node.group);
    const others = nodes.filter((n) => n.group !== node.group);
    const hub = team.indexOf(node) < 2;
    // Inside the team: a few close collaborators; hubs work with everyone.
    const inner = hub ? 6 : 2 + Math.floor(rand() * 2);
    for (let j = 0; j < inner; j += 1) {
      add(node, pick(team), 1 + Math.floor(rand() * (hub ? 5 : 3.4)));
    }
    // Across teams: hubs reach out more, small repos now and then.
    const outer = hub ? 5 : 1 + (rand() < 0.7 ? 1 : 0);
    for (let j = 0; j < outer; j += 1) {
      const other = pick(others);
      // Often the other team's biggest repo: its hub.
      const lead = leads.get(other.group) ?? other;
      add(node, rand() < 0.4 ? lead : other, 1 + Math.floor(rand() * 2.6));
    }
  }
  return links;
};

/** Fieldnote's 60 repos in eight teams; a link = contributors two repos share. */
export const circularGraphDemo: RingData = (() => {
  const rand = mulberry32(29);
  const nodes = makeNodes(rand);
  return { links: makeLinks(nodes, rand), nodes };
})();
