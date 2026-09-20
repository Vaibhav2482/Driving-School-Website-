import { describe, expect, it } from "vitest";
import { formatLessons, formatPackagePrice, formatValidity, vehicleTypeLabel } from "./labels";

describe("package labels", () => {
  it("pluralises lessons", () => {
    expect(formatLessons(1)).toBe("1 lesson");
    expect(formatLessons(10)).toBe("10 lessons");
  });

  it("describes validity in natural units", () => {
    expect(formatValidity(null)).toBeNull();
    expect(formatValidity(1)).toBe("1 day");
    expect(formatValidity(45)).toBe("45 days");
    expect(formatValidity(90)).toBe("3 months");
    expect(formatValidity(365)).toBe("1 year");
    expect(formatValidity(730)).toBe("2 years");
  });

  it("formats prices from integer paise and never advertises a ₹0 plan as free", () => {
    expect(formatPackagePrice({ pricePaise: 500000 })).toBe("₹5,000");
    expect(formatPackagePrice({ pricePaise: 1250050 })).toBe("₹12,500.50");
    expect(formatPackagePrice({ pricePaise: 0 })).toBeNull();
  });

  it("labels vehicle types", () => {
    expect(vehicleTypeLabel("CAR")).toBe("Car");
    expect(vehicleTypeLabel("TWO_WHEELER")).toBe("Two-wheeler");
  });
});
