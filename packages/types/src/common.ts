import { z } from "zod";

/**
 * Shared building blocks for API DTOs. Each domain module (auth, orders,
 * inventory, ...) gets its own file here as it's built; `apps/api` derives
 * its request/response DTOs from these schemas and `apps/web` reuses the
 * same schemas for client-side form validation, so shape and validation
 * rules never drift between frontend and backend.
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}
