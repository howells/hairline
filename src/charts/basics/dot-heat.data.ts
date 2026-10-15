/** A rows × columns grid of values, e.g. weekday × hour. */
export interface DotHeatData {
  columns: string[];
  rows: string[];
  values: number[][];
}

/**
 * Share of US births by weekday and hour of delivery, 2013.
 *
 * Source: CDC/NCHS, Data Brief 200, "When Are Babies Born: Morning, Noon, or
 * Night? Birth Certificate Data for 2013". The brief's data table (Figure 1)
 * only splits Monday to Friday from the weekend, so the hour by weekday
 * counts come from the file behind it, the 2013 natality public use file
 * (Nat2013us.zip, record fields DOB_TT time of birth and DOB_WK weekday).
 * Brief: https://www.cdc.gov/nchs/products/databriefs/db200.htm
 * Table: https://www.cdc.gov/nchs/data/databriefs/db200_table.pdf
 * File: https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Datasets/DVS/natality/Nat2013us.zip
 * Fetched 2026-10-15.
 *
 * Transform: the records with a stated time of birth (the 41 states and the
 * District of Columbia on the 2003 certificate; DOB_TT 9999 or blank is
 * dropped, leaving 3,563,505 of 3,940,764 records) are counted by DOB_WK and
 * the hour of DOB_TT. Each weekday's 24 counts are divided by that weekday's
 * total and given as a per cent to one decimal place.
 * Check: pooling Monday to Friday, and Saturday with Sunday, reproduces the
 * brief's table at 8 a.m. (6.7 and 4.6) and noon (6.3 and 5.0).
 */
export const dotHeatDemo: DotHeatData = {
  columns: [
    "0:00",
    "1:00",
    "2:00",
    "3:00",
    "4:00",
    "5:00",
    "6:00",
    "7:00",
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ],
  rows: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  values: [
    [
      2.1, 2.2, 2.2, 2.2, 2.3, 2.4, 2.5, 4.8, 7.1, 5.1, 5, 5, 6.6, 6.1, 5.3,
      4.9, 5.1, 5.3, 4.8, 4.2, 4.2, 3.8, 3.6, 3.2,
    ],
    [
      2.7, 2.7, 2.6, 2.6, 2.5, 2.6, 2.7, 4.6, 6.7, 5.1, 5, 5, 6.4, 5.9, 5.3,
      4.9, 4.9, 5.1, 4.7, 4, 4, 3.6, 3.4, 3.1,
    ],
    [
      2.8, 2.8, 2.6, 2.6, 2.6, 2.6, 2.7, 4.6, 6.5, 5, 5, 5, 6.2, 5.8, 5.2, 4.9,
      5, 5.1, 4.7, 4.1, 3.9, 3.7, 3.4, 3.1,
    ],
    [
      2.7, 2.8, 2.6, 2.6, 2.5, 2.6, 2.7, 4.5, 6.4, 5, 4.9, 4.9, 6.3, 5.9, 5.2,
      4.9, 5, 5.2, 4.7, 4.1, 4, 3.7, 3.4, 3.2,
    ],
    [
      2.8, 2.8, 2.7, 2.6, 2.6, 2.6, 2.8, 4.9, 7, 5.2, 5, 4.9, 6.2, 5.8, 5.3, 5,
      5, 4.9, 4.4, 3.9, 3.8, 3.5, 3.3, 3.1,
    ],
    [
      3.9, 3.9, 3.8, 3.7, 3.6, 3.6, 3.6, 3.8, 4.7, 5, 5, 4.9, 5, 4.7, 4.6, 4.6,
      4.5, 4.4, 4.1, 3.8, 3.9, 3.7, 3.7, 3.5,
    ],
    [
      3.6, 3.8, 3.5, 3.7, 3.6, 3.6, 3.7, 3.9, 4.6, 4.9, 5, 5, 5, 4.7, 4.7, 4.6,
      4.5, 4.4, 4.1, 3.9, 4, 3.8, 3.7, 3.7,
    ],
  ],
};
