import { z } from "zod";

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
});
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
