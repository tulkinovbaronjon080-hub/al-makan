import { describe, expect, it } from "vitest";
import { calculateProductConfiguration } from "./calculate";
import type { ProductConfigurationInput } from "./types";

function baseInput(overrides: Partial<ProductConfigurationInput> = {}): ProductConfigurationInput {
  return {
    productType: "WINDOW",
    widthMm: 1500,
    heightMm: 1200,
    sections: 2,
    quantity: 1,
    profile: { id: "profile-1", name: "Frame", pricePerMeter: 45000 },
    glass: { id: "glass-1", name: "4mm tempered", pricePerM2: 85000 },
    color: { id: "color-1", name: "White", surchargePerMeter: 0 },
    accessories: [],
    pricing: { laborRatePerMeter: 15000, sealPricePerMeter: 3000, marginPercent: 25 },
    ...overrides,
  };
}

// Hand-computed for the base input above:
// perimeter = 2*(1.5+1.2) = 5.4m, mullions = (2-1)*1.2 = 1.2m, totalProfileM = 6.6m
// area = 1.5*1.2 = 1.8 m2
const TOTAL_PROFILE_M = 6.6;
const AREA_M2 = 1.8;

describe("calculateProductConfiguration", () => {
  it("computes perimeter + internal mullions for the profile BOM line", () => {
    const result = calculateProductConfiguration(baseInput());
    const profileLine = result.bom.find((l) => l.materialId === "profile-1");
    expect(profileLine?.quantity).toBeCloseTo(TOTAL_PROFILE_M, 2);
    expect(profileLine?.unit).toBe("M");
    expect(profileLine?.materialType).toBe("PROFILE");
  });

  it("a single-section product has no mullions (profile length = perimeter only)", () => {
    const result = calculateProductConfiguration(baseInput({ sections: 1 }));
    const profileLine = result.bom.find((l) => l.materialId === "profile-1");
    expect(profileLine?.quantity).toBeCloseTo(2 * (1.5 + 1.2), 2); // 5.4m
  });

  it("computes the glass BOM line from total area, independent of section count", () => {
    const result = calculateProductConfiguration(baseInput());
    const glassLine = result.bom.find((l) => l.materialId === "glass-1");
    expect(glassLine?.quantity).toBeCloseTo(AREA_M2, 2);
    expect(glassLine?.unit).toBe("M2");
    expect(glassLine?.materialType).toBe("GLASS");
  });

  it("materialCost = profile length * pricePerMeter + area * pricePerM2 + color surcharge", () => {
    const result = calculateProductConfiguration(baseInput());
    const expected = Math.round(TOTAL_PROFILE_M * 45000 + AREA_M2 * 85000 + TOTAL_PROFILE_M * 0);
    expect(result.materialCost).toBe(expected);
  });

  it("a color surcharge is added to materialCost via the profile length, not its own BOM line", () => {
    const withSurcharge = calculateProductConfiguration(
      baseInput({ color: { id: "color-2", name: "Wood-effect", surchargePerMeter: 5000 } }),
    );
    const noSurcharge = calculateProductConfiguration(baseInput());

    expect(withSurcharge.materialCost - noSurcharge.materialCost).toBe(Math.round(TOTAL_PROFILE_M * 5000));
    expect(withSurcharge.bom.find((l) => l.materialId === "color-2")).toBeUndefined();
  });

  it("laborCost = total profile length * laborRatePerMeter", () => {
    const result = calculateProductConfiguration(baseInput());
    expect(result.laborCost).toBe(Math.round(TOTAL_PROFILE_M * 15000));
  });

  it("includes a seal/rubber BOM line priced via sealPricePerMeter, bucketed into additionalCost", () => {
    const result = calculateProductConfiguration(baseInput());
    const sealLine = result.bom.find((l) => l.materialId === "seal");
    expect(sealLine).toEqual({
      materialId: "seal",
      materialType: "SEAL",
      label: "Rubber/seal",
      quantity: TOTAL_PROFILE_M,
      unit: "M",
    });
    expect(result.additionalCost).toBe(Math.round(TOTAL_PROFILE_M * 3000));
  });

  it("adds one PCS BOM line per accessory and includes their price in additionalCost", () => {
    const result = calculateProductConfiguration(
      baseInput({
        accessories: [
          { id: "handle-1", name: "Handle - white", price: 25000 },
          { id: "hinge-1", name: "Hinge", price: 8000 },
        ],
      }),
    );

    expect(result.bom).toContainEqual({
      materialId: "handle-1",
      materialType: "ACCESSORY",
      label: "Handle - white",
      quantity: 1,
      unit: "PCS",
    });
    expect(result.bom).toContainEqual({
      materialId: "hinge-1",
      materialType: "ACCESSORY",
      label: "Hinge",
      quantity: 1,
      unit: "PCS",
    });
    expect(result.additionalCost).toBe(Math.round(TOTAL_PROFILE_M * 3000 + 25000 + 8000));
  });

  it("computes margin and selling price from marginPercent", () => {
    const result = calculateProductConfiguration(baseInput());
    const expectedTotal = result.materialCost + result.laborCost + result.additionalCost;
    expect(result.totalCost).toBe(expectedTotal);
    expect(result.margin).toBe(Math.round(expectedTotal * 0.25));
    expect(result.sellingPrice).toBe(expectedTotal + result.margin);
  });

  it("scales cost fields and BOM quantities with quantity", () => {
    const one = calculateProductConfiguration(baseInput({ quantity: 1 }));
    const three = calculateProductConfiguration(baseInput({ quantity: 3 }));

    expect(three.materialCost).toBe(one.materialCost * 3);
    expect(three.laborCost).toBe(one.laborCost * 3);
    expect(three.additionalCost).toBe(one.additionalCost * 3);
    const profileLineOne = one.bom.find((l) => l.materialId === "profile-1")!;
    const profileLineThree = three.bom.find((l) => l.materialId === "profile-1")!;
    expect(profileLineThree.quantity).toBeCloseTo(profileLineOne.quantity * 3, 2);
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
