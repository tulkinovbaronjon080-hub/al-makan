import { z } from "zod";

export const pricingSettingsSchema = z.object({
  laborRatePerMeter: z.number(),
  sealPricePerMeter: z.number(),
  marginPercent: z.number(),
});
export type PricingSettingsDto = z.infer<typeof pricingSettingsSchema>;

export const updatePricingSettingsSchema = z.object({
  laborRatePerMeter: z.number().int().nonnegative().optional(),
  sealPricePerMeter: z.number().int().nonnegative().optional(),
  marginPercent: z.number().int().min(0).max(500).optional(),
});
export type UpdatePricingSettingsDto = z.infer<typeof updatePricingSettingsSchema>;
