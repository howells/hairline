// Deterministic pseudo-randomness for demo data and jitter. Never use
// Math.random() in a chart: every load must look identical.

// Math.imul(x, 1) is ToInt32(x): the same 32-bit wrap as `x | 0`.
const toInt32 = (x: number) => Math.imul(x, 1);

export const mulberry32 = (seed: number) => {
  let state = toInt32(seed);
  return () => {
    state = toInt32(state + 0x6d_2b_79_f5);
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

/** Stable value in [0, 1) for a pair of integers. */
export const rnd = (i: number, k = 0) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43_758.5453;
  return x - Math.floor(x);
};

/** Stable value in [-1, 1). */
export const rndSigned = (i: number, k = 0) => rnd(i, k) * 2 - 1;
