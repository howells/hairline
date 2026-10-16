/**
 * The choropleth's key row: one swatch per shade step, each on a 44px touch
 * target that isolates its step on hover, and the step fills they share with
 * the map.
 */
import { KEY } from "../marks";
import { KeySwatch } from "../texture";
import { clamp, dimClass, sansWidth } from "../util";
import { stepFill } from "./step-fill";

/** Side of a key swatch (KeySwatch), and the gap before its label. */
const SWATCH = KEY.swatch;
const SWATCH_GAP = KEY.gap;
/** Widest gap between keys. */
const KEY_GAP = KEY.entryGap;
/** Each key's pointer target: at least 44 by 44. */
const HIT = 44;

interface LegendProps {
  active: number | null;
  pid: string;
  /** Label for the no-value key; omitted when every region has a value. */
  emptyLabel?: string;
  onStep: (bin: number | null) => void;
  short: (v: number) => string;
  thresholds: readonly number[];
  width: number;
  y: number;
}

/** A key as laid out: its step, label, drawn width and slot (the touch target). */
interface Key {
  bin: number;
  label: string;
  slot: number;
  w: number;
  x: number;
}

/** Keys left to right: no value (when shown), under the first break, then each break and up. */
const keysFor = (props: LegendProps): Key[] => {
  const t = props.thresholds;
  const rows = [
    ...(props.emptyLabel === undefined
      ? []
      : [{ bin: -1, label: props.emptyLabel }]),
    { bin: 0, label: `<${props.short(t[0])}` },
    ...t.map((v, i) => ({ bin: i + 1, label: `${props.short(v)}+` })),
  ];
  const sized = rows.map((r) => {
    const w = SWATCH + SWATCH_GAP + sansWidth(r.label, 12);
    return { ...r, slot: Math.max(HIT, Math.ceil(w)), w };
  });
  // The gap closes up on narrow plots so the row always fits on one line.
  const room = props.width - sized.reduce((acc, k) => acc + k.slot, 0);
  const gap = clamp(room / Math.max(1, sized.length - 1), 0, KEY_GAP);
  const keys: Key[] = [];
  let x = 0;
  for (const k of sized) {
    keys.push({ ...k, x });
    x += k.slot + gap;
  }
  return keys;
};

/** One key with its 44px pointer target; hovering it isolates its step. */
const LegendKey = (props: {
  active: number | null;
  k: Key;
  onStep: (bin: number | null) => void;
  pid: string;
}) => {
  const { k } = props;
  const f = stepFill(k.bin, props.pid);
  const left = k.x + (k.slot - k.w) / 2;
  return (
    <g
      className={dimClass(props.active !== null && props.active !== k.bin)}
      onPointerEnter={() => {
        props.onStep(k.bin);
      }}
      onPointerLeave={() => {
        props.onStep(null);
      }}
    >
      <rect
        className="fill-transparent"
        height={HIT}
        width={k.slot}
        x={k.x}
        y={-HIT / 2}
      />
      <KeySwatch
        fill={f.fill}
        tone={f.fill === undefined ? f.className : undefined}
        x={left}
        y={-SWATCH / 2}
      />
      <text
        className="t-axis pointer-events-none"
        dy="0.35em"
        x={left + SWATCH + SWATCH_GAP}
        y={0}
      >
        {k.label}
      </text>
    </g>
  );
};

/** Room each side of a key's ink inside its touch slot; the row centres on ink. */
const pad = (k?: Key) => (k === undefined ? 0 : (k.slot - k.w) / 2);

/** The key row, centred under the map: one KeySwatch per step. */
export const Legend = (props: LegendProps) => {
  const keys = keysFor(props);
  const last = keys.at(-1);
  const total = last === undefined ? 0 : last.x + last.slot;
  const slack = pad(last) - pad(keys.at(0));
  const left = Math.round(Math.max(0, (props.width - total + slack) / 2));
  return (
    <g transform={`translate(${left}, ${Math.round(props.y)})`}>
      {keys.map((k) => (
        <LegendKey
          active={props.active}
          k={k}
          key={k.bin}
          onStep={props.onStep}
          pid={props.pid}
        />
      ))}
    </g>
  );
};
