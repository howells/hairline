/**
 * Every storm the Met Office lists as named for the UK, Ireland and the
 * Netherlands in the six storm seasons from 2020/21 to 2025/26, each claimed
 * by its season.
 *
 * Source: Met Office UK Storm Centre, one summary page per season:
 * https://weather.metoffice.gov.uk/warnings-and-advice/uk-storm-centre/uk-storm-season-2020-21
 * (and -2021-22, -2022-23, -2023-24, -2024-25, -202526 for 2025/26; index:
 * https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-storm-centre/index).
 * Fetched 2026-10-15 (saved to reference/raw/L5/).
 *
 * Transform: the "Name" column of each season's table is read, in the order
 * the page lists the storms (by date named), with the season as the theme.
 * Storms named by a neighbouring service (for example Alex by Meteo France,
 * Malik by DMI, Darcy by KNMI) are kept, because the Met Office lists them
 * in its season tables. 43 storms in all. Seasons run September to August.
 * Script: reference/scripts/L5/emit.py.
 */
export interface ConvergenceItem {
  id: string;
  theme: string;
}

/** Named storms in order of naming, each with its season. */
export const radialConvergenceDemo: ConvergenceItem[] = [
  { id: "Alex", theme: "2020/21" },
  { id: "Barbara", theme: "2020/21" },
  { id: "Aiden", theme: "2020/21" },
  { id: "Bella", theme: "2020/21" },
  { id: "Christoph", theme: "2020/21" },
  { id: "Darcy", theme: "2020/21" },
  { id: "Evert", theme: "2020/21" },
  { id: "Arwen", theme: "2021/22" },
  { id: "Barra", theme: "2021/22" },
  { id: "Malik", theme: "2021/22" },
  { id: "Corrie", theme: "2021/22" },
  { id: "Dudley", theme: "2021/22" },
  { id: "Eunice", theme: "2021/22" },
  { id: "Franklin", theme: "2021/22" },
  { id: "Otto", theme: "2022/23" },
  { id: "Noa", theme: "2022/23" },
  { id: "Antoni", theme: "2022/23" },
  { id: "Betty", theme: "2022/23" },
  { id: "Agnes", theme: "2023/24" },
  { id: "Babet", theme: "2023/24" },
  { id: "Ciarán", theme: "2023/24" },
  { id: "Debi", theme: "2023/24" },
  { id: "Elin", theme: "2023/24" },
  { id: "Fergus", theme: "2023/24" },
  { id: "Gerrit", theme: "2023/24" },
  { id: "Henk", theme: "2023/24" },
  { id: "Isha", theme: "2023/24" },
  { id: "Jocelyn", theme: "2023/24" },
  { id: "Kathleen", theme: "2023/24" },
  { id: "Lilian", theme: "2023/24" },
  { id: "Ashley", theme: "2024/25" },
  { id: "Bert", theme: "2024/25" },
  { id: "Conall", theme: "2024/25" },
  { id: "Darragh", theme: "2024/25" },
  { id: "Éowyn", theme: "2024/25" },
  { id: "Floris", theme: "2024/25" },
  { id: "Amy", theme: "2025/26" },
  { id: "Benjamin", theme: "2025/26" },
  { id: "Claudia", theme: "2025/26" },
  { id: "Bram", theme: "2025/26" },
  { id: "Goretti", theme: "2025/26" },
  { id: "Chandra", theme: "2025/26" },
  { id: "Dave", theme: "2025/26" },
];
