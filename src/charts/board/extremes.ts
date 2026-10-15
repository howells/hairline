// Where a series is at its lowest or highest: the weeks and months the board's
// cursors rest on.

/** Index of the first lowest value. */
export const lowestIndex = (values: number[]) => {
  let low = 0;
  for (const [i, v] of values.entries()) {
    if (v < values[low]) {
      low = i;
    }
  }
  return low;
};

/** Index of the first highest value. */
export const highestIndex = (values: number[]) => {
  let high = 0;
  for (const [i, v] of values.entries()) {
    if (v > values[high]) {
      high = i;
    }
  }
  return high;
};
