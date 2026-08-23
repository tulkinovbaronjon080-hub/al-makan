import type { ProductConfigurationInput, ProductConfigurationResult } from "./types";

/**
 * PLACEHOLDER FORMULA — Phase 0 exists only to prove this function is a
 * pure, dependency-free, independently testable domain service (per the
 * project brief: never put calculation formulas inside UI components).
 *
 * Real per-brand/per-profile/per-glass pricing tables, labor formulas, and
 * BOM derivation land in Phase 5 once the catalog module (brands, series,
 * profiles, glass, accessories) exists to look prices up from. Until then
 * this uses flat placeholder rates so callers and tests have a stable
 * shape to build against.
 */

const PLACEHOLDER_MATERIAL_RATE_PER_M2 = 350_000; // UZS per m^2
const PLACEHOLDER_LABOR_RATE_PER_SECTION = 40_000; // UZS per section
const PLACEHOLDER_MARGIN_RATE = 0.25;

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

  const areaM2 = (input.widthMm / 1000) * (input.heightMm / 1000);

  const materialCost = Math.round(areaM2 * PLACEHOLDER_MATERIAL_RATE_PER_M2 * input.quantity);
  const laborCost = Math.round(
    input.sections * PLACEHOLDER_LABOR_RATE_PER_SECTION * input.quantity,
  );
  const additionalCost = 0;
  const totalCost = materialCost + laborCost + additionalCost;
  const margin = Math.round(totalCost * PLACEHOLDER_MARGIN_RATE);
  const sellingPrice = totalCost + margin;

  return {
    bom: [
      {
        materialId: input.profileId,
        label: "Profile (placeholder)",
        quantity: Number((2 * ((input.widthMm + input.heightMm) / 1000)).toFixed(2)),
        unit: "M",
      },
      {
        materialId: input.glassId,
        label: "Glass (placeholder)",
        quantity: Number(areaM2.toFixed(2)),
        unit: "M2",
      },
    ],
    materialCost,
    laborCost,
    additionalCost,
    totalCost,
    margin,
    sellingPrice,
  };
}
