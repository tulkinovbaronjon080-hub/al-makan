import { describe, expect, it } from "vitest";
import { calculateProductConfiguration } from "./calculate";
import type { ProductConfigurationInput } from "./types";

function baseInput(overrides: Partial<ProductConfigurationInput> = {}): ProductConfigurationInput {
  return {
    productType: "WINDOW",
    widthMm: 1500,
    heightMm: 1200,
    sections: 2,
    profileId: "profile-1",
    glassId: "glass-1",
    colorId: "color-white",
    accessoryIds: [],
    quantity: 1,
    ...overrides,
  };
}

describe("calculateProductConfiguration", () => {
  it("derives cost fields and a BOM from dimensions", () => {
    const result = calculateProductConfiguration(baseInput());

    expect(result.materialCost).toBeGreaterThan(0);
    expect(result.laborCost).toBeGreaterThan(0);
    expect(result.totalCost).toBe(result.materialCost + result.laborCost + result.additionalCost);
    expect(result.sellingPrice).toBeGreaterThan(result.totalCost);
    expect(result.bom).toHaveLength(2);
    expect(result.bom[0]?.unit).toBe("M");
    expect(result.bom[1]?.unit).toBe("M2");
  });

  it("scales material cost with quantity", () => {
    const one = calculateProductConfiguration(baseInput({ quantity: 1 }));
    const three = calculateProductConfiguration(baseInput({ quantity: 3 }));

    expect(three.materialCost).toBe(one.materialCost * 3);
  });

  it("rejects non-positive dimensions", () => {
    expect(() => calculateProductConfiguration(baseInput({ widthMm: 0 }))).toThrow();
    expect(() => calculateProductConfiguration(baseInput({ heightMm: -10 }))).toThrow();
  });

  it("rejects fewer than 1 section or quantity", () => {
    expect(() => calculateProductConfiguration(baseInput({ sections: 0 }))).toThrow();
    expect(() => calculateProductConfiguration(baseInput({ quantity: 0 }))).toThrow();
  });
});
