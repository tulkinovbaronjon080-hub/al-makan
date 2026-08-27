import type { ProductConfigurationInput, ProductConfigurationResult } from "./types";

/**
 * Reads real catalog prices (packages/database's Profile/Glass/Color/
 * Accessory + PricingSettings, passed in by the caller — see types.ts).
 * Replaces the Phase 0-4 placeholder (flat area-based rate); see the
 * Phase 5 plan for the formula rationale.
 *
 * Existing OrderItem rows already snapshotted whatever the placeholder
 * computed at their creation time and are untouched by this change —
 * only newly created items use this formula.
 */
export function calculateProductConfiguration(
  input: ProductConfigurationInput,
): ProductConfigurationResult {
  if (input.widthMm <= 0 || input.heightMm <= 0) {
    throw new Error("width and height must be positive");
  }
  if (input.sections < 1) {
    throw new Error("sections must be at least 1");
  }
  if (input.quantity < 1) {
    throw new Error("quantity must be at least 1");
  }

  const widthM = input.widthMm / 1000;
  const heightM = input.heightMm / 1000;
  const areaM2 = widthM * heightM;

  const perimeterM = 2 * (widthM + heightM);
  const mullionsM = (input.sections - 1) * heightM;
  const totalProfileM = perimeterM + mullionsM;

  const accessoriesUnitCost = input.accessories.reduce((sum, a) => sum + a.price, 0);
  const sealUnitCost = totalProfileM * input.pricing.sealPricePerMeter;

  const materialCost = Math.round(
    (totalProfileM * input.profile.pricePerMeter +
      areaM2 * input.glass.pricePerM2 +
      totalProfileM * input.color.surchargePerMeter) *
      input.quantity,
  );
  const laborCost = Math.round(totalProfileM * input.pricing.laborRatePerMeter * input.quantity);
  const additionalCost = Math.round((sealUnitCost + accessoriesUnitCost) * input.quantity);
  const totalCost = materialCost + laborCost + additionalCost;
  const margin = Math.round((totalCost * input.pricing.marginPercent) / 100);
  const sellingPrice = totalCost + margin;

  return {
    bom: [
      {
        materialId: input.profile.id,
        materialType: "PROFILE",
        label: `Profile — ${input.profile.name}`,
        quantity: Number((totalProfileM * input.quantity).toFixed(2)),
        unit: "M",
      },
      {
        materialId: input.glass.id,
        materialType: "GLASS",
        label: `Glass — ${input.glass.name}`,
        quantity: Number((areaM2 * input.quantity).toFixed(2)),
        unit: "M2",
      },
      {
        materialId: "seal",
        materialType: "SEAL",
        label: "Rubber/seal",
        quantity: Number((totalProfileM * input.quantity).toFixed(2)),
        unit: "M",
      },
      ...input.accessories.map((a) => ({
        materialId: a.id,
        materialType: "ACCESSORY" as const,
        label: a.name,
        quantity: input.quantity,
        unit: "PCS" as const,
      })),
    ],
    materialCost,
    laborCost,
    additionalCost,
    totalCost,
    margin,
    sellingPrice,
  };
}
