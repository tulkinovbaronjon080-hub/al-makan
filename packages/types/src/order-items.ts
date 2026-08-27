import { z } from "zod";

/**
 * Mirrors @al-makan/calculation-engine's ProductType/BomLine shapes
 * independently — packages stay dependency-free of each other (same call
 * already made for OrderStatus, which lives in both this package and
 * @al-makan/ui). See the Phase 4 plan.
 */

export const productTypeSchema = z.enum(["WINDOW", "DOOR", "FORTOCHKA", "BALCONY"]);
export type ProductType = z.infer<typeof productTypeSchema>;

export const openingDirectionSchema = z.enum(["FIXED", "LEFT_HINGED", "RIGHT_HINGED", "TILT_TURN"]);
export type OpeningDirection = z.infer<typeof openingDirectionSchema>;

export const createOrderItemSchema = z.object({
  productType: productTypeSchema,
  widthMm: z.number().int().min(300).max(3000),
  heightMm: z.number().int().min(300).max(3000),
  sections: z.number().int().min(1).max(6),
  openingDirection: openingDirectionSchema,
  profileId: z.string().min(1),
  glassId: z.string().min(1),
  colorId: z.string().min(1),
  accessoryIds: z.array(z.string().min(1)).default([]),
  quantity: z.number().int().min(1).max(50),
});
export type CreateOrderItemDto = z.infer<typeof createOrderItemSchema>;

const bomLineSchema = z.object({
  materialId: z.string(),
  label: z.string(),
  quantity: z.number(),
  unit: z.enum(["M", "M2", "PCS"]),
});

const catalogRefSchema = z.object({ id: z.string(), name: z.string() });

export const orderItemSchema = z.object({
  id: z.string(),
  productType: productTypeSchema,
  widthMm: z.number(),
  heightMm: z.number(),
  sections: z.number(),
  openingDirection: openingDirectionSchema,
  profile: catalogRefSchema,
  glass: catalogRefSchema,
  color: catalogRefSchema,
  accessoryIds: z.array(z.string()),
  quantity: z.number(),
  materialCost: z.number(),
  laborCost: z.number(),
  additionalCost: z.number(),
  totalCost: z.number(),
  margin: z.number(),
  sellingPrice: z.number(),
  bom: z.array(bomLineSchema),
  createdAt: z.string(),
});
export type OrderItemDto = z.infer<typeof orderItemSchema>;
