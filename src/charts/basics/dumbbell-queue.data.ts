export interface DumbbellDatum {
  after: number;
  before: number;
  label: string;
}

/**
 * F12 Museum visits. Visits in millions to five of the national museums
 * sponsored by the Department for Culture, Media and Sport, calendar 2019
 * (before) against calendar 2025 (after), the five with the most visits in
 * 2019: Tate 8.85 and 5.99; British Museum 6.24 and 6.44; National Gallery 6.01 and 4.15; Natural History 5.58 and 6.37; Science Museum 5.19 and 4.16.
 *
 * Source: DCMS, "Monthly and Quarterly Visits to DCMS-sponsored Museums and
 * Galleries - to June 2026", data tables, Table 1a (Open Government Licence
 * v3.0). The figures are provisional and some are revised between releases;
 * the file's notes record closures (for example Tate Liverpool from October
 * 2023, the National Portrait Gallery until June 2023).
 *   https://www.gov.uk/government/statistical-data-sets/museums-and-galleries-monthly-visits
 *   https://assets.publishing.service.gov.uk/media/6a96e0803b22fb169dc1901c/Monthly_and_Quarterly_Visits_to_DCMS-sponsored_Museums_and_Galleries_-_to_June_2026_data_tables.ods
 * Fetched 2026-10-15.
 *
 * Transform: for every row marked "Museum group" in Table 1a, add the twelve
 * monthly columns of 2019 and of 2025; keep the five largest by 2019. Millions,
 * two decimals. Names shortened: Tate (Tate Total), Natural History (Natural
 * History Museum Total), Science Museum (Science Museum Group Total).
 * Scripts: reference/scripts/F12/gen.py.
 */
export const dumbbellQueueDemo: DumbbellDatum[] = [
  { after: 5.99, before: 8.85, label: "Tate" },
  { after: 6.44, before: 6.24, label: "British Museum" },
  { after: 4.15, before: 6.01, label: "National Gallery" },
  { after: 6.37, before: 5.58, label: "Natural History" },
  { after: 4.16, before: 5.19, label: "Science Museum" },
];
