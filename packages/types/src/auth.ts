import { z } from "zod";

/**
 * Shared between apps/api (server-side validation via ZodValidationPipe)
 * and apps/web (client-side form validation via zodResolver) so the rules
 * never drift between the two — see packages/types/src/index.ts.
 */

export const registerSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(20).optional(),
  password: z.string().min(8).max(72),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
});

export const authBusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const authRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const meResponseSchema = z.object({
  user: authUserSchema,
  business: authBusinessSchema,
  role: authRoleSchema,
  permissions: z.array(z.string()),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
  business: authBusinessSchema,
  role: authRoleSchema,
  permissions: z.array(z.string()),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;
