import type { DailyDatum } from "./hairline-line.data";
import { dayAfter } from "./util-a";

/**
 * F3 Daylight in Tromsø. Minutes the sun is above the horizon in Tromsø,
 * Norway (69.6492 N, 18.9553 E), on each local day of 2026 (UTC+1, no
 * summer time), 365 days. The sun stays below the horizon all day to
 * 14 January and again from 28 November (48 days of polar night), and
 * never sets from 18 May to 24 July (68 days of midnight sun).
 *
 * Source: U.S. Naval Observatory, Astronomical Applications Department, Rise,
 * Set and Transit API, one request a day (a US government publication, public
 * domain). Times are given to the minute.
 *   https://aa.usno.navy.mil/api/rstt/oneday?date=2026-01-01&coords=69.6492,18.9553&tz=1&dst=false
 *   (the same request for each date to 2026-12-31)
 * Fetched 2026-10-16.
 *
 * Transform: for each date, 1440 minutes where the source reports "Object
 * continuously above the Horizon", 0 where it reports "Object continuously
 * below the Horizon", otherwise the minutes between each "Rise" and the
 * next "Set" within the day, counting from midnight when the sun is already
 * up and to midnight when it has not set (17 May rises, sets at 23:27 and
 * rises again at 23:53). Each value is divided by 60 to
 * give hours. Scripts: reference/scripts/F3/fetch_tromso.py, gen_tromso.py.
 */
const minutes = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50, 82, 106, 126, 143, 159, 174,
  189, 203, 215, 228, 240, 253, 264, 276, 286, 298, 309, 319, 329, 340, 350,
  360, 370, 380, 390, 400, 410, 420, 429, 438, 448, 458, 466, 476, 485, 494,
  503, 512, 521, 530, 539, 548, 557, 565, 575, 583, 592, 600, 609, 618, 626,
  635, 643, 652, 661, 670, 678, 687, 695, 704, 712, 721, 730, 738, 746, 754,
  763, 771, 780, 788, 797, 806, 814, 824, 832, 841, 850, 858, 867, 876, 884,
  893, 902, 911, 920, 929, 938, 947, 956, 965, 975, 984, 994, 1003, 1013, 1023,
  1032, 1042, 1052, 1062, 1072, 1082, 1093, 1103, 1115, 1125, 1136, 1147, 1159,
  1171, 1183, 1196, 1209, 1223, 1237, 1252, 1268, 1285, 1304, 1325, 1350, 1396,
  1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440,
  1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440,
  1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440,
  1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440,
  1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440, 1440,
  1440, 1440, 1440, 1416, 1387, 1350, 1324, 1303, 1285, 1268, 1252, 1237, 1223,
  1209, 1197, 1185, 1172, 1161, 1149, 1137, 1126, 1116, 1104, 1094, 1084, 1073,
  1063, 1054, 1044, 1034, 1025, 1015, 1006, 996, 987, 977, 968, 960, 950, 941,
  932, 923, 915, 906, 897, 889, 880, 871, 863, 854, 846, 837, 828, 820, 811,
  803, 794, 785, 777, 769, 761, 752, 744, 735, 727, 718, 711, 702, 693, 685,
  676, 668, 659, 651, 642, 634, 626, 618, 609, 601, 591, 583, 574, 565, 557,
  548, 540, 531, 522, 513, 504, 496, 486, 477, 468, 459, 449, 441, 431, 422,
  412, 403, 394, 384, 374, 364, 354, 344, 333, 323, 313, 301, 291, 280, 268,
  258, 246, 233, 221, 208, 195, 181, 167, 151, 134, 116, 95, 68, 22, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0,
];

export const hairlineAreaDemo: DailyDatum[] = minutes.map((m, i) => ({
  date: dayAfter("2026-01-01", i),
  value: m / 60,
}));
