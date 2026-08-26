import { z } from "zod";
import { paginationQuerySchema } from "./common";

/**
 * Pricing/spec reference data for Phase 4 (configurator) and Phase 5
 * (calculation engine). Every price is whole UZS (z.number().int()) —
 * matches the convention already in @al-makan/calculation-engine's
 * placeholder formula; see the Phase 3 plan for why not Prisma.Decimal.
 */

const nameSchema = z.string().trim().min(1).max(120);
const priceSchema = z.number().int().nonnegative();

// Shared list-query shape (pagination + search + isActive filter) —
// validated as one object via ZodValidationPipe, same lesson learned in
// Phase 2's orders list (an unparsed query field must 400, not 500).
// isActive is undefined by default (show everything, active + inactive —
// this is an admin management list, not a Phase 4 configurator picker),
// only filters when the caller explicitly passes it.
export const catalogListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type CatalogListQuery = z.infer<typeof catalogListQuerySchema>;

export const profileSeriesListQuerySchema = catalogListQuerySchema.extend({
  brandId: z.string().min(1).optional(),
});
export type ProfileSeriesListQuery = z.infer<typeof profileSeriesListQuerySchema>;

export const profileListQuerySchema = catalogListQuerySchema.extend({
  seriesId: z.string().min(1).optional(),
});
export type ProfileListQuery = z.infer<typeof profileListQuerySchema>;

// ---------- Brand ----------

export const createBrandSchema = z.object({ name: nameSchema });
export type CreateBrandDto = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = z.object({ name: nameSchema.optional(), isActive: z.boolean().optional() });
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BrandDto = z.infer<typeof brandSchema>;

// ---------- ProfileSeries ----------

export const createProfileSeriesSchema = z.object({ brandId: z.string().min(1), name: nameSchema });
export type CreateProfileSeriesDto = z.infer<typeof createProfileSeriesSchema>;

export const updateProfileSeriesSchema = z.object({
  name: nameSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProfileSeriesDto = z.infer<typeof updateProfileSeriesSchema>;

export const profileSeriesSchema = z.object({
  id: z.string(),
  brandId: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProfileSeriesDto = z.infer<typeof profileSeriesSchema>;

// ---------- Profile ----------

export const createProfileSchema = z.object({
  seriesId: z.string().min(1),
  name: nameSchema,
  pricePerMeter: priceSchema,
});
export type CreateProfileDto = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  pricePerMeter: priceSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const profileSchema = z.object({
  id: z.string(),
  seriesId: z.string(),
  name: z.string(),
  pricePerMeter: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProfileDto = z.infer<typeof profileSchema>;

// ---------- Glass ----------

export const createGlassSchema = z.object({ name: nameSchema, pricePerM2: priceSchema });
export type CreateGlassDto = z.infer<typeof createGlassSchema>;

export const updateGlassSchema = z.object({
  name: nameSchema.optional(),
  pricePerM2: priceSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateGlassDto = z.infer<typeof updateGlassSchema>;

export const glassSchema = z.object({
  id: z.string(),
  name: z.string(),
  pricePerM2: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GlassDto = z.infer<typeof glassSchema>;

// ---------- Color ----------

export const createColorSchema = z.object({ name: nameSchema, surchargePerMeter: priceSchema.default(0) });
export type CreateColorDto = z.infer<typeof createColorSchema>;

export const updateColorSchema = z.object({
  name: nameSchema.optional(),
  surchargePerMeter: priceSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateColorDto = z.infer<typeof updateColorSchema>;

export const colorSchema = z.object({
  id: z.string(),
  name: z.string(),
  surchargePerMeter: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ColorDto = z.infer<typeof colorSchema>;

// ---------- Accessory ----------

export const createAccessorySchema = z.object({ name: nameSchema, price: priceSchema });
export type CreateAccessoryDto = z.infer<typeof createAccessorySchema>;

export const updateAccessorySchema = z.object({
  name: nameSchema.optional(),
  price: priceSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAccessoryDto = z.infer<typeof updateAccessorySchema>;

export const accessorySchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AccessoryDto = z.infer<typeof accessorySchema>;
