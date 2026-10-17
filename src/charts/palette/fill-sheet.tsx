import { Plot, Tooltip } from "../core";
import { FILL_FAMILIES, FILL_LADDERS, FILL_TONES, toneClass } from "../fills";
import type { FillTone } from "../fills";
import { useHover } from "../hooks";
import { HitRect } from "../hover";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { EngravedRect, PlateLabel } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { stagger } from "../util";
import { FillPatterns } from "./fill-patterns";

interface Sheet {
  col: (k: number) => number;
  labelX: number;
  rowH: number;
  tileH: number;
  tileW: number;
  top: number;
}

/** Tile size, columns and rows for a width: six tone columns after the names. */
const sheetFor = (width: number): Sheet => {
  const narrow = width < 560;
  const labelW = narrow ? 92 : 136;
  const gap = narrow ? 4 : 8;
  const tileW = Math.min(
    160,
    Math.floor(
      (width - labelW - gap * (FILL_TONES.length - 1)) / FILL_TONES.length
    )
  );
  const tileH = narrow ? 28 : 44;
  return {
    col: (k) => labelW + k * (tileW + gap),
    labelX: 0,
    rowH: tileH + (narrow ? 8 : 10),
    tileH,
    tileW,
    top: 28,
  };
};

type Hover = ReturnType<typeof useHover<string>>;

interface TileProps {
  fill: string;
  hover: Hover;
  label: string;
  order: number;
  solid: string | undefined;
  w: number;
  h: number;
  x: number;
  y: number;
}

/** One specimen: the fill on paper inside its 1px rule, named on hover. */
const Tile = (p: TileProps) => (
  <g
    className="fade"
    style={stagger(p.order, "fine")}
    onPointerEnter={() => {
      p.hover.show(p.label, p.x + p.w / 2, p.y);
    }}
    onPointerLeave={() => {
      p.hover.clear();
    }}
  >
    {p.solid === undefined ? (
      <EngravedRect fill={p.fill} height={p.h} width={p.w} x={p.x} y={p.y} />
    ) : (
      <rect
        className={`${p.solid} stroke-l5 shape-crisp`}
        height={p.h - 1}
        rx={2}
        strokeWidth={1}
        width={p.w - 1}
        x={Math.round(p.x) + 0.5}
        y={Math.round(p.y) + 0.5}
      />
    )}
  </g>
);

/** Broken rungs only exist inside a 2px rung, so their specimen is a stack of rungs. */
const RungTile = (p: Omit<TileProps, "solid">) => (
  <g
    className="fade"
    style={stagger(p.order, "fine")}
    onPointerEnter={() => {
      p.hover.show(p.label, p.x + p.w / 2, p.y);
    }}
    onPointerLeave={() => {
      p.hover.clear();
    }}
  >
    <HitRect height={p.h} width={p.w} x={p.x} y={p.y} />
    {Array.from({ length: Math.floor((p.h - 4) / 6) + 1 }, (_, k) => (
      <rect
        fill={p.fill}
        height={2}
        key={`rung-${p.y + 2 + k * 6}`}
        width={Math.round(p.w)}
        x={Math.round(p.x)}
        y={Math.round(p.y) + 2 + k * 6}
      />
    ))}
  </g>
);

const RowName = (p: { label: string; y: number }) => (
  <Label middle muted voice="label" x={0} y={p.y}>
    {p.label}
  </Label>
);

interface BodyProps {
  hover: Hover;
  id: (name: string) => string;
  s: Sheet;
}

/** Families × tones: a tile wherever the taxonomy allows that pairing. */
const FamilyRows = ({ hover, id, s }: BodyProps) => (
  <g>
    {FILL_TONES.map((t, k) => (
      <Label key={t.id} voice="axis" x={s.col(k)} y={s.top - 10}>
        {t.label}
      </Label>
    ))}
    {FILL_FAMILIES.map((family, r) => {
      const y = s.top + r * s.rowH;
      const allowed: readonly FillTone[] = family.tones;
      return (
        <g key={family.id}>
          <RowName label={family.label} y={y + s.tileH / 2} />
          {FILL_TONES.map((t, k) => {
            if (!allowed.includes(t.id)) {
              return null;
            }
            const common = {
              fill: paint(id(`${family.id}-${t.id}`)),
              h: s.tileH,
              hover,
              label: `${family.label} · ${t.label.toLowerCase()}`,
              order: r + k,
              w: s.tileW,
              x: s.col(k),
              y,
            };
            if (family.id === "beads") {
              return <RungTile key={t.id} {...common} />;
            }
            return (
              <Tile
                key={t.id}
                {...common}
                solid={family.id === "solid" ? toneClass(t.id) : undefined}
              />
            );
          })}
        </g>
      );
    })}
  </g>
);

/** The value ladders, lightest step first, under their own step numbers. */
const LadderRows = ({ hover, id, s, top }: BodyProps & { top: number }) => {
  const rows = FILL_LADDERS.flatMap((ladder) =>
    ladder.tones.map((tone) => ({ ladder, tone }))
  );
  return (
    <g>
      <HRule
        kind="rule"
        x0={0}
        x1={s.col(FILL_TONES.length - 1) + s.tileW}
        y={top - 26}
      />
      {[1, 2, 3, 4, 5].map((n, k) => (
        <Label key={n} voice="axis" x={s.col(k)} y={top - 10}>
          {n}
        </Label>
      ))}
      {rows.map(({ ladder, tone }, r) => {
        const y = top + r * s.rowH;
        const name =
          ladder.tones.length > 1
            ? `${ladder.label} · ${tone === "mid" ? "mid" : "quiet"}`
            : ladder.label;
        return (
          <g key={`${ladder.id}-${tone}`}>
            <RowName label={name} y={y + s.tileH / 2} />
            {ladder.steps.map((step, k) => (
              <Tile
                key={`${step.pitch}-${step.r}`}
                fill={paint(id(`${ladder.id}-${tone}-${k}`))}
                h={s.tileH}
                hover={hover}
                label={`${name} · step ${k + 1}`}
                order={r + k + 8}
                solid={undefined}
                w={s.tileW}
                x={s.col(k)}
                y={y}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

/** The specimens a label row shows: text on a screen, a halftone and the hero. */
const LABEL_SPECIMENS = [
  { fill: "stipple-mid", hero: false, text: "42" },
  { fill: "halftone-mid-3", hero: false, text: "48" },
  { fill: "hatch-quiet", hero: false, text: "Notes" },
  { fill: "cross-ink", hero: true, text: "63" },
] as const;

/** Text on a fill: a paper plate cut out of it, or an ink plate on the hero. */
const LabelRow = ({ hover, id, s, top }: BodyProps & { top: number }) => (
  <g>
    <HRule
      kind="rule"
      x0={0}
      x1={s.col(FILL_TONES.length - 1) + s.tileW}
      y={top - 26}
    />
    <RowName label="Labels on fills" y={top + s.tileH / 2} />
    {LABEL_SPECIMENS.map((sp, k) => (
      <g key={sp.fill}>
        <Tile
          fill={paint(id(sp.fill))}
          h={s.tileH}
          hover={hover}
          label={
            sp.hero
              ? "Label on the hero · ink plate"
              : "Label on a fill · paper plate"
          }
          order={k + 12}
          solid={undefined}
          w={s.tileW}
          x={s.col(k)}
          y={top}
        />
        <g className="fade pointer-events-none" style={stagger(k + 14, "fine")}>
          <PlateLabel
            hero={sp.hero}
            text={sp.text}
            x={s.col(k) + s.tileW / 2}
            y={top + s.tileH / 2}
          />
        </g>
      </g>
    ))}
  </g>
);

/**
 * The fills sheet: every fill the library may use, families by tone, then the
 * two value ladders. It is the agreed taxonomy (src/charts/fills.ts) drawn.
 */
export const FillSheet = () => {
  const id = useTextureIds("fills");
  const hover = useHover<string>();
  const ladderRows = FILL_LADDERS.reduce((n, l) => n + l.tones.length, 0);
  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y - 6}>
            {hover.at.key}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const s = sheetFor(width);
        const ladderTop = s.top + FILL_FAMILIES.length * s.rowH + 44;
        const labelTop = ladderTop + ladderRows * s.rowH + 44;
        const height = labelTop + s.rowH;
        return (
          <ChartSvg
            height={height}
            label="The fills every chart may use"
            title="Fills"
            width={width}
          >
            <FillPatterns id={id} />
            <FamilyRows hover={hover} id={id} s={s} />
            <LadderRows hover={hover} id={id} s={s} top={ladderTop} />
            <LabelRow hover={hover} id={id} s={s} top={labelTop} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
