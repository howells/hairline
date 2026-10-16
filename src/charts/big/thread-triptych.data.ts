/**
 * B3 Mammal tree: the largest genera of the largest families of the largest
 * orders of living mammals, each one thread from genus to family to order to
 * superorder.
 * Source: GBIF Backbone Taxonomy (CC BY 4.0), species search,
 * https://api.gbif.org/v1/species/search?highertaxonKey=359&rank=SPECIES&status=ACCEPTED&isExtinct=false
 * (Mammalia is key 359). Fetched 2026-10-15; the raw pages are in
 * reference/raw/B3/api.
 * Rule: only accepted species the backbone flags extinct=false count as
 * living (6,318 of them); each carries its genus, family and order. Species
 * are counted per genus, family and order. The six orders with most living
 * species (Rodentia, Chiroptera, Primates, Soricomorpha, Carnivora,
 * Artiodactyla); of each, the three families with most; of each family, the
 * two genera with most (ties broken alphabetically). Extinct genera and
 * species, and any taxon with no extinct flag, are left out. Names follow the
 * backbone, so the shrews and moles sit in Soricomorpha. Soricomorpha's third
 * family, Solenodontidae, has one genus, so there are 35 paths.
 *
 * Superorders: the backbone has no superorder rank, so each family's comes
 * from the Mammal Diversity Database v2.5 (CC BY 4.0),
 * MDD_v2.5_6904species.csv, column "superorder", for its living species.
 *   https://doi.org/10.5281/zenodo.21654811
 * Fetched 2026-10-16. Every living species of each of the 18 families has
 * one superorder: Euarchontoglires for the rodent and primate families,
 * Laurasiatheria for the rest (MDD files the shrews, moles and solenodons
 * under Eulipotyphla). Orders are listed by superorder, then by size.
 * Script: reference/scripts/B3-mdd/superorders.py.
 */

/** One path: a genus and every rank above it, left to right. */
export interface ThreadPath {
  id: string;
  /** One name per column, e.g. genus, family, order, superorder. */
  stops: string[];
}

export interface TriptychData {
  /** Each column's names, top to bottom. */
  columns: string[][];
  paths: ThreadPath[];
}

/** Superorder of each order, by its families' living species in the MDD. */
const SUPERORDER = new Map([
  ["Artiodactyla", "Laurasiatheria"],
  ["Carnivora", "Laurasiatheria"],
  ["Chiroptera", "Laurasiatheria"],
  ["Primates", "Euarchontoglires"],
  ["Rodentia", "Euarchontoglires"],
  ["Soricomorpha", "Laurasiatheria"],
]);

/** [order, family, genus], by superorder, then largest first at every level, by living species. */
const TREE: [string, string, string][] = [
  ["Rodentia", "Muridae", "Rattus"],
  ["Rodentia", "Muridae", "Mus"],
  ["Rodentia", "Cricetidae", "Microtus"],
  ["Rodentia", "Cricetidae", "Peromyscus"],
  ["Rodentia", "Sciuridae", "Sciurus"],
  ["Rodentia", "Sciuridae", "Tamias"],
  ["Primates", "Cercopithecidae", "Macaca"],
  ["Primates", "Cercopithecidae", "Trachypithecus"],
  ["Primates", "Pitheciidae", "Plecturocebus"],
  ["Primates", "Pitheciidae", "Pithecia"],
  ["Primates", "Callitrichidae", "Mico"],
  ["Primates", "Callitrichidae", "Saguinus"],
  ["Chiroptera", "Vespertilionidae", "Myotis"],
  ["Chiroptera", "Vespertilionidae", "Murina"],
  ["Chiroptera", "Phyllostomidae", "Sturnira"],
  ["Chiroptera", "Phyllostomidae", "Artibeus"],
  ["Chiroptera", "Pteropodidae", "Pteropus"],
  ["Chiroptera", "Pteropodidae", "Nyctimene"],
  ["Soricomorpha", "Soricidae", "Crocidura"],
  ["Soricomorpha", "Soricidae", "Sorex"],
  ["Soricomorpha", "Talpidae", "Talpa"],
  ["Soricomorpha", "Talpidae", "Euroscaptor"],
  ["Soricomorpha", "Solenodontidae", "Solenodon"],
  ["Carnivora", "Mustelidae", "Mustela"],
  ["Carnivora", "Mustelidae", "Martes"],
  ["Carnivora", "Viverridae", "Genetta"],
  ["Carnivora", "Viverridae", "Paradoxurus"],
  ["Carnivora", "Felidae", "Felis"],
  ["Carnivora", "Felidae", "Leopardus"],
  ["Artiodactyla", "Bovidae", "Ovis"],
  ["Artiodactyla", "Bovidae", "Cephalophus"],
  ["Artiodactyla", "Cervidae", "Muntiacus"],
  ["Artiodactyla", "Cervidae", "Mazama"],
  ["Artiodactyla", "Suidae", "Sus"],
  ["Artiodactyla", "Suidae", "Babyrousa"],
];

/** Genus, family, order and superorder of each path. */
const STOPS = TREE.map(([order, family, genus]) => [
  genus,
  family,
  order,
  SUPERORDER.get(order) ?? "",
]);

/** 35 living genera, 18 families, 6 orders, 2 superorders: one thread per genus. */
export const threadTriptychDemo: TriptychData = {
  columns: [0, 1, 2, 3].map((c) => [...new Set(STOPS.map((s) => s[c] ?? ""))]),
  paths: STOPS.map((stops) => ({ id: stops.join(">"), stops })),
};
