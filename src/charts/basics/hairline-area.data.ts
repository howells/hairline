import type { DailyDatum } from "./hairline-line.data";
import { dayAfter } from "./util-a";

/**
 * F3 Shrinking days. Minutes between sunrise and sunset in London (51.5072 N,
 * 0.1276 W) on each day from 1 August to 1 October 2026, 62 days: 925 minutes
 * on 1 August (sunrise 04:24, sunset 19:49), 697 on 1 October (sunrise 06:01, sunset
 * 17:38), 228 fewer. Times are GMT.
 *
 * Source: U.S. Naval Observatory, Astronomical Applications Department, Rise,
 * Set and Transit API, one request a day (a US government publication, public
 * domain). Times are given to the minute.
 *   https://aa.usno.navy.mil/api/rstt/oneday?date=2026-08-01&coords=51.5072,-0.1276&tz=0&dst=false
 *   (the same request for each date to 2026-10-01)
 * Fetched 2026-10-15.
 *
 * Transform: daylight = the "Rise" time subtracted from the "Set" time, in
 * minutes, for each date. Each value is divided by 60 to give hours for the
 * chart; because the source rounds each time to a minute, a day's length is good
 * to about a minute. Scripts: reference/scripts/F3/gen.py.
 */
const minutes = [
  925, 921, 918, 915, 912, 908, 905, 901, 899, 895, 891, 888, 884, 881, 877,
  873, 870, 866, 863, 859, 856, 852, 848, 844, 840, 837, 833, 829, 826, 821,
  818, 814, 810, 807, 802, 799, 795, 790, 787, 783, 780, 775, 771, 768, 763,
  760, 756, 751, 748, 744, 741, 736, 732, 729, 724, 721, 717, 712, 709, 705,
  702, 697,
];

export const hairlineAreaDemo: DailyDatum[] = minutes.map((m, i) => ({
  date: dayAfter("2026-08-01", i),
  value: m / 60,
}));
