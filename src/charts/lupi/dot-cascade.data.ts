export interface DotCascadeDatum {
  label: string;
  value: number;
}

/** Fieldnote incidents by root cause, January 2025 to December 2026. */
export const dotCascadeDemo: DotCascadeDatum[] = [
  { label: "Unknown", value: 2 },
  { label: "DNS", value: 3 },
  { label: "Certificate", value: 4 },
  { label: "Human", value: 6 },
  { label: "Queue", value: 8 },
  { label: "Network", value: 10 },
  { label: "Cache", value: 12 },
  { label: "Database", value: 16 },
  { label: "Capacity", value: 20 },
  { label: "Dependency", value: 25 },
  { label: "Config", value: 34 },
  { label: "Deploy", value: 46 },
];
