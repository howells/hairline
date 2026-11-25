import { describe, expect, it } from "vitest";

import { fmtSignedPct } from "../src/lib/format";
import { intlFormatSchema } from "../src/schema/format";

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

describe("intlFormatSchema: Intl.NumberFormat invariants", () => {
  it("rejects options that Intl.NumberFormat would throw on at render time", () => {
    expect(intlFormatSchema.safeParse({ style: "currency" }).success).toBe(
      false
    );
    expect(
      intlFormatSchema.safeParse({ style: "unit", unit: "widgets" }).success
    ).toBe(false);
    expect(
      intlFormatSchema.safeParse({
        maximumFractionDigits: 1,
        minimumFractionDigits: 3,
      }).success
    ).toBe(false);
  });

  it("accepts valid Intl.NumberFormat descriptors", () => {
    expect(
      intlFormatSchema.safeParse({ currency: "GBP", style: "currency" }).success
    ).toBe(true);
    expect(
      intlFormatSchema.safeParse({ style: "unit", unit: "kilometer" }).success
    ).toBe(true);
  });
});
