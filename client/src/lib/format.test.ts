import { describe, expect, it } from "vitest";
import { formatInr } from "./format";

describe("formatInr (integer paise → rupees)", () => {
  it("formats whole rupees without decimals, using Indian digit grouping", () => {
    expect(formatInr(500000)).toBe("₹5,000");
    expect(formatInr(12345600)).toBe("₹1,23,456");
  });

  it("shows paise when present", () => {
    expect(formatInr(12550)).toBe("₹125.50");
  });

  it("handles zero", () => {
    expect(formatInr(0)).toBe("₹0");
  });

  it("rejects non-integer input rather than silently rounding money", () => {
    expect(() => formatInr(1234.5)).toThrow(TypeError);
  });
});
