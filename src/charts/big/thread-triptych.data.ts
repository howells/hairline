/**
 * B3 Mammal tree: the largest genera of the largest families of the largest
 * orders of living mammals, each one thread from genus to family to order.
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
 */

/** One path: where a genus starts, the family it sits in, the order it lands in. */
export interface ThreadPath {
  destination: string;
  id: string;
  processor: string;
  source: string;
}

export interface TriptychData {
  /** Column order, top to bottom. */
  destinations: string[];
  paths: ThreadPath[];
  processors: string[];
  sources: string[];
}

/** [order, family, genus], largest first at every level, by living species. */
const TREE: [string, string, string][] = [
  ["Rodentia", "Muridae", "Rattus"],
  ["Rodentia", "Muridae", "Mus"],
  ["Rodentia", "Cricetidae", "Microtus"],
  ["Rodentia", "Cricetidae", "Peromyscus"],
  ["Rodentia", "Sciuridae", "Sciurus"],
  ["Rodentia", "Sciuridae", "Tamias"],
  ["Chiroptera", "Vespertilionidae", "Myotis"],
  ["Chiroptera", "Vespertilionidae", "Murina"],
  ["Chiroptera", "Phyllostomidae", "Sturnira"],
  ["Chiroptera", "Phyllostomidae", "Artibeus"],
  ["Chiroptera", "Pteropodidae", "Pteropus"],
  ["Chiroptera", "Pteropodidae", "Nyctimene"],
  ["Primates", "Cercopithecidae", "Macaca"],
  ["Primates", "Cercopithecidae", "Trachypithecus"],
  ["Primates", "Pitheciidae", "Plecturocebus"],
  ["Primates", "Pitheciidae", "Pithecia"],
  ["Primates", "Callitrichidae", "Mico"],
  ["Primates", "Callitrichidae", "Saguinus"],
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

/** 35 living genera, 18 families, 6 orders of mammals: one thread per genus. */
export const threadTriptychDemo: TriptychData = {
  destinations: [...new Set(TREE.map(([order]) => order))],
  paths: TREE.map(([order, family, genus]) => ({
    destination: order,
    id: `${genus}>${family}>${order}`,
    processor: family,
    source: genus,
  })),
  processors: [...new Set(TREE.map((row) => row[1]))],
  sources: TREE.map((row) => row[2]),
};
