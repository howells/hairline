import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { normals } from "../util";

/** Ladder step for rank `rank` of `n`, spread so the last stays readable at step `lightest`. */
export const ladderStep = (rank: number, n: number, lightest = 5) => {
  if (n <= 1) {
    return 0;
  }
  const step = Math.round((rank / (n - 1)) * lightest);
  return Math.max(0, Math.min(lightest, step));
};

/** Live visibility (unlike useReveal, it flips back when scrolled away). */
export const useInView = (
  ref: RefObject<HTMLElement | null>,
  threshold = 0.1
) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
      },
      { threshold }
    );
    if (ref.current !== null) {
      io.observe(ref.current);
    }
    return () => {
      io.disconnect();
    };
  }, [ref, threshold]);
  return inView;
};

/** Deterministic log-normal samples: the shared normal draws, exponentiated. */
export const logNormals = (
  seed: number,
  n: number,
  median: number,
  sigma: number
) => normals(seed, n, 0, sigma).map((z) => median * Math.exp(z));

const GAUSS = 1 / Math.sqrt(2 * Math.PI);

/** Gaussian kernel density of `values`, sampled at `at`. */
export const density = (values: number[], at: number[], bandwidth: number) =>
  at.map((x) => {
    let s = 0;
    for (const v of values) {
      const u = (x - v) / bandwidth;
      s += GAUSS * Math.exp(-0.5 * u * u);
    }
    return s / (values.length * bandwidth);
  });

/** Silverman's rule-of-thumb bandwidth. */
export const silverman = (values: number[]) => {
  const n = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n - 1)
  );
  return 1.06 * sd * n ** -0.2;
};

/** Height of the glance control slot: one control's 44px hit area. */
export const CONTROL_SLOT_H = 44;

/** Hairlines in the heaviest link bundle. */
const MOST_LINES = 4;

/** How many hairlines a link of `value` gets: one to four, by its share of the heaviest. */
export const bundleLines = (value: number, max: number) =>
  Math.max(1, Math.min(MOST_LINES, Math.ceil((value / max) * MOST_LINES)));
