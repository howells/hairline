/**
 * The one tip's card: paper, a 1px rule (ink while pinned), the small radius,
 * wrapped at a readable measure. Pointer's tip and Tooltip both wear it, so
 * every chart's hover reads the same.
 */
export const tipCard = (pinned: boolean) =>
  `bg-paper text-ink text-tick/normal pointer-events-none absolute z-10 w-max max-w-72 rounded-sm border px-3 py-2 text-pretty tabular-nums [&_b]:font-semibold ${pinned ? "border-ink" : "border-l5"}`;
