/** A percentage to the tenth, without a needless ".0": "38.5%", "10%". */
export const fmtPercent = (v: number) => `${Number(v.toFixed(1))}%`;
