import { z } from "zod";

/**
 * Mirrors the Prisma MaterialType/StockMovementType enums independently —
 * same convention as orderStatusSchema/productionStageSchema (this package
 * stays DB-agnostic).
 */
export const materialTypeSchema = z.enum(["PROFILE", "GLASS", "SEAL", "ACCESSORY"]);
export type MaterialType = z.infer<typeof materialTypeSchema>;

// Single source of truth for "what unit does this material type track in" —
// SEAL and PROFILE are both meters but different physical materials.
export const MATERIAL_TYPE_UNIT: Record<MaterialType, "M" | "M2" | "PCS"> = {
  PROFILE: "M",
  GLASS: "M2",
  SEAL: "M",
  ACCESSORY: "PCS",
};

export const stockMovementTypeSchema = z.enum(["RECEIVE", "ADJUSTMENT", "PRODUCTION_CONSUME"]);
export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;

export const recordMovementSchema = z
  .object({
    locationId: z.string().min(1),
    materialType: materialTypeSchema,
    materialId: z.string().min(1),
    type: z.enum(["RECEIVE", "ADJUSTMENT"]),
    quantityDelta: z.number(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => (v.type === "RECEIVE" ? v.quantityDelta > 0 : v.quantityDelta !== 0), {
    message: "Receiving stock requires a positive quantity; an adjustment must be non-zero",
    path: ["quantityDelta"],
  });
export type RecordMovementDto = z.infer<typeof recordMovementSchema>;

const locationFilterQuerySchema = z.object({
  locationId: z.string().min(1).optional(),
});

export const getStockQuerySchema = locationFilterQuerySchema;
export type GetStockQuery = z.infer<typeof getStockQuerySchema>;

export const listMovementsQuerySchema = locationFilterQuerySchema;
export type ListMovementsQuery = z.infer<typeof listMovementsQuerySchema>;

export const stockBalanceSchema = z.object({
  locationId: z.string(),
  locationName: z.string(),
  materialType: materialTypeSchema,
  materialId: z.string(),
  label: z.string(),
  quantity: z.number(),
  unit: z.enum(["M", "M2", "PCS"]),
});
export type StockBalanceDto = z.infer<typeof stockBalanceSchema>;

export const stockMovementSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  locationName: z.string(),
  materialType: materialTypeSchema,
  materialId: z.string(),
  label: z.string(),
  type: stockMovementTypeSchema,
  quantityDelta: z.number(),
  note: z.string().nullable(),
  orderId: z.string().nullable(),
  createdAt: z.string(),
});
export type StockMovementDto = z.infer<typeof stockMovementSchema>;
