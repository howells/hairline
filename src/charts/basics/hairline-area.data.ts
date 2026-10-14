import type { DailyDatum } from "./hairline-line.data";
import { dayAfter } from "./util-a";

// Daily active users (thousands), 1 August to 1 October: the summer lull,
// then the return to work, peaking on Tuesday 22 September.
const users = [
  120, 120, 134, 130, 131, 130, 125, 106, 108, 123, 120, 122, 124, 123, 105,
  109, 129, 128, 130, 135, 138, 118, 121, 144, 144, 143, 147, 150, 128, 128,
  154, 155, 153, 155, 159, 137, 136, 161, 164, 163, 163, 166, 145, 142, 167,
  171, 170, 168, 171, 150, 148, 171, 179, 172, 171, 171, 149, 148, 169, 170,
  172, 169,
];

/** Fieldnote's daily active users, August to September 2026. */
export const hairlineAreaDemo: DailyDatum[] = users.map((v, i) => ({
  date: dayAfter("2026-08-01", i),
  value: v * 1000,
}));
