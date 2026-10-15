/**
 * Wine grape varieties grouped by the parent they descend from, each dot a
 * variety sized by its hectares of vineyard worldwide in 2023; the paths are
 * varieties that descend from two of the families.
 *
 * Sources:
 * - Areas: Kym Anderson and Signe Nelgen, University of Adelaide, "Which
 *   winegrape varieties are grown where?", database of winegrape bearing areas
 *   by variety, 2000 to 2023, sheet "World ranking 2023" (area2023, hectares):
 *   https://economics.adelaide.edu.au/wine-economics/databases
 *   (file varieties_2000_to_2023.xlsx, saved to reference/raw/L6/).
 * - Parentage: the Vitis International Variety Catalogue (VIVC), the
 *   passport page of each variety and of every ancestor, "Prime name of
 *   parent 1" and "parent 2": https://www.vivc.de/index.php?r=passport%2Fview&id=<VIVC number>
 *   (saved to reference/raw/L6/vivc/). VIVC numbers were looked up by name
 *   through Wikidata property P3904 (https://query.wikidata.org/); only the
 *   number is taken from Wikidata, never a parent.
 * Fetched 2026-10-15.
 *
 * Transform (scripts in reference/scripts/L6/): take the 90 varieties with
 * the largest 2023 area, dropping the "other" rows; follow each one's VIVC
 * parents back to the founders. Five founders are used, the ones with the most
 * descendants among the 90: Savagnin blanc, Heunisch weiss, Hebén, Muscat
 * blanc (VIVC "Muscat a petits grains blancs") and Cabernet franc. A variety
 * joins the family of the founder nearest to it in generations (ties go to
 * the earlier of the five in that order); a variety that also descends from
 * a second founder draws a path between the two families. Varieties with no
 * recorded pedigree, or none from these founders, are left out. Areas are
 * rounded to whole hectares; each family's members are sorted by size.
 * Members: Savagnin blanc has Sauvignon Blanc, Pinot Noir, Chenin Blanc,
 * Verdejo, Grüner Veltliner, Mencía and Castelão; Heunisch weiss has
 * Chardonnay, Riesling, Colombard, Aligoté, Isabella, Müller-Thurgau,
 * Blaufränkisch, Fetească Regală, Moldova and Zweigelt; Hebén has
 * Tempranillo, Airén, Macabeo, Fernão Pires, Xarello and Parellada; Muscat
 * blanc has Muscat of Alexandria, Cereza, Muscat Ottonel, Criolla Grande,
 * Pedro Giménez, Grillo, Bianca and Torrontés Riojano; Cabernet franc has
 * Cabernet Sauvignon, Merlot and Marselan.
 */
export interface ClusterDatum {
  id: string;
  label: string;
  /** One size per member (e.g. hectares); sizes the member dot by area. */
  members: number[];
  /** Hub position in frame units; the frame is cropped to the hubs and scaled to the width. */
  at?: [number, number];
}

export interface ClusterField {
  clusters: ClusterDatum[];
  /** Paths between cluster ids: a member descending from both. */
  links: [string, string][];
}

export const clusterFieldDemo: ClusterField = {
  clusters: [
    {
      at: [215, 215],
      id: "heunisch",
      label: "Heunisch weiss",
      members: [
        222_927, 53_421, 30_083, 24_990, 23_096, 18_353, 15_714, 12_603, 12_431,
        8483,
      ],
    },
    {
      at: [500, 100],
      id: "savagnin",
      label: "Savagnin blanc",
      members: [144_031, 131_983, 30_859, 25_320, 19_082, 11_629, 8990],
    },
    {
      at: [545, 268],
      id: "cabfranc",
      label: "Cabernet franc",
      members: [279_479, 257_778, 10_322],
    },
    {
      at: [450, 420],
      id: "heben",
      label: "Hebén",
      members: [226_805, 190_426, 58_160, 12_331, 11_229, 9351],
    },
    {
      at: [62, 410],
      id: "muscat",
      label: "Muscat blanc",
      members: [30_218, 24_834, 13_493, 12_531, 9558, 9482, 8941, 7914],
    },
  ],
  links: [
    ["savagnin", "heunisch"],
    ["cabfranc", "savagnin"],
    ["heben", "savagnin"],
    ["heunisch", "muscat"],
  ],
};
