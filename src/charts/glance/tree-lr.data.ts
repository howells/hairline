/**
 * G7 Indo-European: four branches of the Indo-European family and three
 * languages under each.
 *
 * Source: Glottolog 5.3 (Hammarström, Forkel, Haspelmath and Bank, Max Planck
 * Institute for Evolutionary Anthropology, Leipzig, 2026), CC BY 4.0,
 * https://doi.org/10.5281/zenodo.15525265 . File glottolog_languoid.csv.zip,
 * https://glottolog.org/meta/downloads , fetched 2026-10-15.
 *
 * Transform: Glottolog's tree is much deeper than this one. Indo-European
 * (indo1319) has Classical Indo-European (clas1257) below it; Germanic
 * (germ1287), Italic then Romance (roma1334) and Celtic (celt1248) sit under
 * that, and Slavic (slav1255) sits under Balto-Slavic. This chart prunes the
 * intermediate families and keeps the four branches directly under the root.
 * The twelve languages were chosen by hand, spread across each branch's
 * sub-branches, and each was checked in the file to have its branch among its
 * ancestors (English stan1293, German stan1295 and Icelandic icel1247 under
 * Germanic; French stan1290, Italian ital1282 and Romanian roma1327 under
 * Romance; Irish iris1253, Welsh wels1247 and Breton bret1244 under Celtic;
 * Russian russ1263, Polish poli1260 and Bulgarian bulg1262 under Slavic).
 */

export interface TreeDatum {
  name: string;
  children?: TreeDatum[];
}

/** Twelve Indo-European languages under four of its branches. */
export const treeLRDemo: TreeDatum = {
  children: [
    {
      children: [
        { name: "English" },
        { name: "German" },
        { name: "Icelandic" },
      ],
      name: "Germanic",
    },
    {
      children: [{ name: "French" }, { name: "Italian" }, { name: "Romanian" }],
      name: "Romance",
    },
    {
      children: [{ name: "Irish" }, { name: "Welsh" }, { name: "Breton" }],
      name: "Celtic",
    },
    {
      children: [
        { name: "Russian" },
        { name: "Polish" },
        { name: "Bulgarian" },
      ],
      name: "Slavic",
    },
  ],
  name: "Indo-European",
};
