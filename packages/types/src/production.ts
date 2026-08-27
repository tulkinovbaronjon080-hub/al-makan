import { z } from "zod";

/**
 * Mirrors the Prisma ProductionStage enum independently — same convention as
 * orderStatusSchema (this package stays DB-agnostic).
 */
export const productionStageSchema = z.enum([
  "QUEUED",
  "CUTTING",
  "ASSEMBLY",
  "GLAZING",
  "QUALITY_CHECK",
  "DONE",
]);
export type ProductionStage = z.infer<typeof productionStageSchema>;

// Single source of truth for "what's the next stage" — consumed by
// ProductionService's forward-only validation and by the web UI's
// "Mark as {next stage}" button label.
export const PRODUCTION_STAGE_SEQUENCE: readonly ProductionStage[] = [
  "QUEUED",
  "CUTTING",
  "ASSEMBLY",
  "GLAZING",
  "QUALITY_CHECK",
  "DONE",
];

export const productionTaskSchema = z.object({
  id: z.string(),
  stage: productionStageSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductionTaskDto = z.infer<typeof productionTaskSchema>;

// Flattened, UI-ready row for the shop-floor queue — one per active task.
export const productionQueueItemSchema = z.object({
  taskId: z.string(),
  stage: productionStageSchema,
  orderId: z.string(),
  orderNumber: z.number(),
  customerName: z.string(),
  productType: z.string(),
  widthMm: z.number(),
  heightMm: z.number(),
  quantity: z.number(),
  createdAt: z.string(),
});
export type ProductionQueueItemDto = z.infer<typeof productionQueueItemSchema>;

export const materialRequirementSchema = z.object({
  materialId: z.string(),
  label: z.string(),
  quantity: z.number(),
  unit: z.enum(["M", "M2", "PCS"]),
});
export type MaterialRequirementDto = z.infer<typeof materialRequirementSchema>;

export const advanceProductionStageSchema = z.object({
  stage: productionStageSchema,
});
export type AdvanceProductionStageDto = z.infer<typeof advanceProductionStageSchema>;
