import { KeySwatch } from "../texture";

export interface KeyItem {
  /** A pattern (`paint(id)`) or colour for the swatch; or pass `tone`. */
  fill?: string;
  /** Series name, in the axis voice. */
  label?: string;
  /** Fill class for a solid swatch, e.g. "fill-ink". */
  tone?: string;
  /** The value at the cursor, in the value voice. */
  value?: string;
}

/** The board's chart keys: a KeySwatch, then a name and/or a value. */
export const Key = (props: {
  className?: string;
  items: KeyItem[];
  /** Swatches set close together, as one scale. */
  scale?: boolean;
}) => (
  <div
    className={`text-tick flex min-h-3 flex-wrap justify-center gap-y-2 leading-none tabular-nums ${props.scale === true ? "gap-x-0.5" : "gap-x-5"} ${props.className ?? ""}`}
  >
    {props.items.map((item) => (
      <span
        key={`${item.label ?? ""}-${item.fill ?? item.tone ?? ""}`}
        className="inline-flex items-center gap-2"
      >
        <svg aria-hidden="true" className="shrink-0" height={12} width={12}>
          <KeySwatch fill={item.fill} tone={item.tone} x={0} y={0} />
        </svg>
        {item.label !== undefined && (
          <span className="text-muted">{item.label}</span>
        )}
        {item.value !== undefined && (
          <span className="text-ink text-xs font-semibold">{item.value}</span>
        )}
      </span>
    ))}
  </div>
);
