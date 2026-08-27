/**
 * Domain types for product configuration → price/BOM calculation.
 * No framework (React/Nest/Prisma) types leak in here — this package must
 * stay importable from both the API (source of truth) and the web app
 * (instant client-side preview) without pulling in either runtime.
 *
 * Callers pass real catalog price data, not IDs — this function can't
 * look prices up itself (it has no database access by design). Both
 * callers already hold the full Profile/Glass/Color/Accessory rows and
 * the business's PricingSettings at the point they call this.
 */

export type ProductType = "WINDOW" | "DOOR" | "FORTOCHKA" | "BALCONY";

export interface CatalogProfileInput {
  id: string;
  name: string;
  pricePerMeter: number;
}

export interface CatalogGlassInput {
  id: string;
  name: string;
  pricePerM2: number;
}

export interface CatalogColorInput {
  id: string;
  name: string;
  surchargePerMeter: number;
}

export interface CatalogAccessoryInput {
  id: string;
  name: string;
  price: number;
}

export interface PricingSettingsInput {
  laborRatePerMeter: number;
  sealPricePerMeter: number;
  marginPercent: number;
}

export interface ProductConfigurationInput {
  productType: ProductType;
  widthMm: number;
  heightMm: number;
  sections: number;
  quantity: number;
  profile: CatalogProfileInput;
  glass: CatalogGlassInput;
  color: CatalogColorInput;
  accessories: CatalogAccessoryInput[];
  pricing: PricingSettingsInput;
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
