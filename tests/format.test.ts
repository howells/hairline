import { describe, expect, it } from "vitest";

import { fmtSignedPct } from "../src/lib/format";

describe("fmtSignedPct: a change, signed", () => {
  it("signs a rise and a fall with a true minus", () => {
    expect(fmtSignedPct(3)).toBe("+3%");
    expect(fmtSignedPct(-3)).toBe("−3%");
  });

  it("prints a change that rounds to nothing as no change, never −0%", () => {
    expect(fmtSignedPct(-0.4)).toBe("0%");
    expect(fmtSignedPct(0.04, 1)).toBe("0.0%");
    expect(fmtSignedPct(0)).toBe("0%");
  });
});
