import { z } from "zod";

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  address: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;

export const customerSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomerDto = z.infer<typeof customerSchema>;
