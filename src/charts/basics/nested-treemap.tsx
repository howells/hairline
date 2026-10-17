import { hierarchy, treemap, treemapDice, treemapSquarify } from "d3-hierarchy";
import type { HierarchyRectangularNode } from "d3-hierarchy";
import type { ReactNode } from "react";

import { fmtInt } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, TipText } from "../hover";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch, PlateLabel, Rules, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth, stagger, sum } from "../util";
import { nestedTreemapDemo } from "./nested-treemap.data";
import type { TreemapGroup } from "./nested-treemap.data";
import { maxIndex } from "./util-b";

interface NestedTreemapProps {
  data?: TreemapGroup[];
  /** Formats a leaf's value, bare: the chart's name carries the unit. */
  format?: (v: number) => string;
  height?: number;
  /** Leaf to draw in the hero colour, as "Group/Leaf" or a leaf name. Defaults to the largest leaf. */
  highlight?: string;
}

interface TreeNode {
  children?: TreeNode[];
  name: string;
  value?: number;
}

type Rect = HierarchyRectangularNode<TreeNode>;

/** A laid-out leaf, flattened for rendering and the tooltip. */
interface Tile {
  group: string;
  h: number;
  id: string;
  name: string;
  value: number;
  w: number;
  x: number;
  y: number;
}

interface Band {
  name: string;
  share: number;
  x: number;
  y: number;
}

interface TreeLayout {
  bands: Band[];
  tiles: Tile[];
}

const BAND = 30;

/** A tile's 1px outline sits one pixel in; plates and group names align to it. */
const INSET = 1;

/** One engraving per parent, in parent order: stipple, hatch, rules. */
const TEXTURES = ["stipple", "hatch", "rules"] as const;
type Texture = (typeof TEXTURES)[number];

/** The engraving for a parent group. */
const textureOf = (bands: Band[], group: string): Texture =>
  TEXTURES[
    Math.max(
      0,
      bands.findIndex((b) => b.name === group)
    ) % TEXTURES.length
  ] ?? "stipple";

/** The tile engravings, one per parent, each on paper. */
const TreeTextures = (props: { ids: (name: Texture) => string }) => (
  <defs>
    <Stipple id={props.ids("stipple")} tone="fill-l3" />
    <Hatch id={props.ids("hatch")} tone="fill-l4" />
    <Rules id={props.ids("rules")} tone="fill-l4" />
  </defs>
);

const layoutTree = (
  width: number,
  height: number,
  data: TreemapGroup[]
): TreeLayout => {
  const narrow = width < 520;
  const squarify = treemapSquarify.ratio(1.2);
  // Largest first at both levels, so the biggest parent and tile lead.
  const groups = data
    .map((g) => ({
      children: g.children.toSorted((a, b) => b.value - a.value),
      name: g.name,
      total: sum(g.children.map((c) => c.value)),
    }))
    .toSorted((a, b) => b.total - a.total);
  const root = hierarchy<TreeNode>({ children: groups, name: "root" }).sum(
    (d) => d.value ?? 0
  );
  const laid: Rect = treemap<TreeNode>()
    .size([width, height])
    // Wide: parents stand side by side as columns under their title bands.
    .tile((node, x0, y0, x1, y1) => {
      if (node.depth === 0 && !narrow) {
        treemapDice(node, x0, y0, x1, y1);
      } else {
        squarify(node, x0, y0, x1, y1);
      }
    })
    .paddingInner((n) => {
      if (n.depth === 0) {
        return narrow ? 12 : 18;
      }
      return narrow ? 4 : 7;
    })
    .paddingTop((n) => (n.depth === 1 ? BAND : 0))
    .round(true)(root);
  const total = laid.value ?? 1;
  const bands = (laid.children ?? []).map((g) => ({
    name: g.data.name,
    share: (g.value ?? 0) / total,
    // Flush with the group's tiles: the name starts on their outline.
    x: g.x0 + INSET,
    y: g.y0 + BAND - 12,
  }));
  const tiles = laid.leaves().map((leaf) => {
    const group = leaf.parent?.data.name ?? "";
    return {
      group,
      h: leaf.y1 - leaf.y0,
      id: `${group}/${leaf.data.name}`,
      name: leaf.data.name,
      value: leaf.value ?? 0,
      w: leaf.x1 - leaf.x0,
      x: leaf.x0,
      y: leaf.y0,
    };
  });
  return { bands, tiles };
};

/** Room a tile keeps to spare around its label, and the label's line pitch. */
const PAD = 10;
const LINE = 16;

/** How a tile carries its name: across, up its side, or not at all. */
type Fit = "across" | "none" | "up";

/** Tile corners: 4 for a large tile, 2 for a small one. */
const tileRx = (tile: Tile) => (tile.w < 48 || tile.h < 48 ? 2 : 4);

/**
 * Every tile names itself: across the top when it is wide enough, up its
 * left side when it is a tall sliver, with its value under the name when
 * there is room. The label sits on a plate cut out of the engraving.
 */
const fitOf = (tile: Tile): Fit => {
  const nameW = sansWidth(tile.name, 12);
  if (tile.w >= nameW + PAD * 2 && tile.h >= LINE + PAD * 2) {
    return "across";
  }
  if (tile.h >= nameW + PAD * 2 && tile.w >= LINE + 4) {
    return "up";
  }
  return "none";
};

/** A plate's height: name and value plates stack this far apart. */
const PLATE = 15;
/** How far a label's plates sit in from the tile's top-left corner. */
const LABEL_INSET = 8;

/**
 * Name and value inside a tile, set across or up its side to fit, each on a
 * plate set in from the tile's top-left corner, engraving showing round it.
 */
const TileLabel = (props: {
  format: (v: number) => string;
  hero: boolean;
  index: number;
  tile: Tile;
}) => {
  const { tile } = props;
  const fit = fitOf(tile);
  // Bare values in every tile: the chart's name carries the unit.
  const valueText = props.format(tile.value);
  const value = sansWidth(valueText, 11);
  if (fit === "none") {
    return null;
  }
  const x = tile.x + LABEL_INSET;
  const y = tile.y + LABEL_INSET;
  if (fit === "up") {
    return (
      <g
        className="fade"
        style={stagger(props.index, "series")}
        transform={`translate(${x} ${y}) rotate(-90)`}
      >
        <PlateLabel
          anchor="end"
          className="t-label"
          hero={props.hero}
          text={tile.name}
          x={0}
          y={PLATE / 2}
        />
      </g>
    );
  }
  const valueFits = tile.h >= LINE * 2 + PAD * 2 && tile.w >= value + PAD * 2;
  return (
    <g className="fade" style={stagger(props.index, "series")}>
      <PlateLabel
        anchor="start"
        className="t-label"
        hero={props.hero}
        text={tile.name}
        x={x}
        y={y + PLATE / 2}
      />
      {valueFits ? (
        <PlateLabel
          anchor="start"
          className="t-axis"
          hero={props.hero}
          text={valueText}
          x={x}
          y={y + PLATE + PLATE / 2}
        />
      ) : null}
    </g>
  );
};

/**
 * A tile: its engraving (or the hero's ink), then its label, then its 1px
 * outline over both.
 */
const TileMark = (props: {
  children: ReactNode;
  fill: string;
  hero: boolean;
  index: number;
  tile: Tile;
}) => {
  const { tile } = props;
  const box = {
    height: tile.h - 1,
    rx: tileRx(tile),
    style: stagger(props.index, "series"),
    width: tile.w - 1,
    x: tile.x + 0.5,
    y: tile.y + 0.5,
  };
  return (
    <>
      <rect
        {...box}
        className={`grow-y from-top ${props.hero ? "fill-hero" : ""}`}
        fill={props.hero ? undefined : props.fill}
      />
      {props.children}
      <rect
        {...box}
        className={`grow-y from-top shape-crisp fill-none ${props.hero ? "stroke-hero" : "stroke-l5"}`}
        strokeWidth={1}
      />
    </>
  );
};

/**
 * F13 Treemap. Two levels: each parent is a title band with its share, its
 * children tile the space under it with area = value. Each parent's tiles
 * share one engraving (stipple, hatch or rules) on paper inside a 1px rule,
 * so area carries the comparison and texture the family; the largest leaf is
 * ink.
 */
export const NestedTreemap = (props: NestedTreemapProps) => {
  const data = props.data ?? nestedTreemapDemo;
  const height = props.height ?? 420;
  const format = props.format ?? fmtInt;
  const hover = useHover<string>();
  const textures = useTextureIds("tree");
  const total = sum(data.flatMap((g) => g.children.map((c) => c.value)));
  const leaves = data.flatMap((g) =>
    g.children.map((c) => ({
      group: g.name,
      id: `${g.name}/${c.name}`,
      name: c.name,
      value: c.value,
    }))
  );
  const tipped =
    hover.key === null ? undefined : leaves.find((l) => l.id === hover.key);
  const label = data
    .map(
      (g) =>
        `${g.name}: ${g.children.map((c) => `${c.name} ${format(c.value)}`).join(", ")}`
    )
    .join("; ");

  return (
    <Plot
      overlay={
        hover.at === null || tipped === undefined ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                format(tipped.value),
                `${Math.round((tipped.value / total) * 100)}% of all`,
                tipped.group,
              ]}
              lead={tipped.name}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const { bands, tiles } = layoutTree(width, height, data);
        const hero =
          props.highlight === undefined
            ? tiles[maxIndex(tiles.map((t) => t.value))]?.id
            : tiles.find(
                (t) => t.id === props.highlight || t.name === props.highlight
              )?.id;
        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <TreeTextures ids={textures} />
            {bands.map((b, i) => (
              <Label
                key={b.name}
                order={i}
                tier="series"
                voice="label"
                x={b.x}
                y={b.y}
              >
                {b.name} · {Math.round(b.share * 100)}%
              </Label>
            ))}
            {tiles.map((tile, i) => (
              <DimGroup
                dim={hover.dim(tile.id)}
                key={tile.id}
                onPointerEnter={() => {
                  hover.show(tile.id, tile.x + tile.w / 2, tile.y + 10);
                }}
              >
                <TileMark
                  fill={paint(textures(textureOf(bands, tile.group)))}
                  hero={hero === tile.id}
                  index={i}
                  tile={tile}
                >
                  <TileLabel
                    format={format}
                    hero={hero === tile.id}
                    index={i}
                    tile={tile}
                  />
                </TileMark>
              </DimGroup>
            ))}
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
