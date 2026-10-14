export interface SankeyFlow {
  from: string;
  to: string;
  value: number;
}

export interface AggregateSankeyData {
  flows: SankeyFlow[];
  /** Left column, top to bottom. */
  sources: string[];
  /** Right column, top to bottom. */
  targets: string[];
}

/** Fieldnote's 1,250 new paying accounts in 2026: the channel they came from and the plan they chose. */
export const aggregateSankeyDemo: AggregateSankeyData = {
  flows: [
    { from: "Word of mouth", to: "Plus", value: 300 },
    { from: "Word of mouth", to: "Business", value: 170 },
    { from: "Word of mouth", to: "Enterprise", value: 50 },
    { from: "Newsletter", to: "Plus", value: 210 },
    { from: "Newsletter", to: "Business", value: 80 },
    { from: "Newsletter", to: "Enterprise", value: 20 },
    { from: "Podcasts", to: "Plus", value: 170 },
    { from: "Podcasts", to: "Business", value: 70 },
    { from: "Podcasts", to: "Enterprise", value: 20 },
    { from: "Partners", to: "Plus", value: 30 },
    { from: "Partners", to: "Business", value: 60 },
    { from: "Partners", to: "Enterprise", value: 70 },
  ],
  sources: ["Word of mouth", "Newsletter", "Podcasts", "Partners"],
  targets: ["Plus", "Business", "Enterprise"],
};
