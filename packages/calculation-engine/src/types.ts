/**
 * Domain types for product configuration → price/BOM calculation.
 * No framework (React/Nest/Prisma) types leak in here — this package must
 * stay importable from both the API (source of truth) and, later, the web
 * app (instant client-side preview) without pulling in either runtime.
 */

export type ProductType = "WINDOW" | "DOOR" | "FORTOCHKA" | "BALCONY";

export interface ProductConfigurationInput {
  productType: ProductType;
  widthMm: number;
  heightMm: number;
  sections: number;
  profileId: string;
  glassId: string;
  colorId: string;
  accessoryIds: string[];
  quantity: number;
}

export interface BomLine {
  materialId: string;
  label: string;
  quantity: number;
  unit: "M" | "M2" | "PCS";
}

export interface ProductConfigurationResult {
  bom: BomLine[];
  materialCost: number;
  laborCost: number;
  additionalCost: number;
  totalCost: number;
  margin: number;
  sellingPrice: number;
}
