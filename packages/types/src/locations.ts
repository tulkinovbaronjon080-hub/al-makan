import { z } from "zod";
import { paginationQuerySchema } from "./common";

// Mirrors the Prisma LocationType enum independently, same convention as
// every other Prisma-backed enum in this package.
export const locationTypeSchema = z.enum(["WAREHOUSE", "STORE", "SHOWROOM", "FACTORY", "OTHER"]);
export type LocationType = z.infer<typeof locationTypeSchema>;

export const locationListQuerySchema = paginationQuerySchema.extend({
  isActive: z.coerce.boolean().optional(),
});
export type LocationListQuery = z.infer<typeof locationListQuerySchema>;

export const createLocationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: locationTypeSchema,
  address: z.string().trim().max(300).optional(),
});
export type CreateLocationDto = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  type: locationTypeSchema.optional(),
  address: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLocationDto = z.infer<typeof updateLocationSchema>;

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: locationTypeSchema,
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LocationDto = z.infer<typeof locationSchema>;
