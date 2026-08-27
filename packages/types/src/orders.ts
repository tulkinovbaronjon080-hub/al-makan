import { z } from "zod";
import { paginationQuerySchema } from "./common";
import { customerSchema } from "./customers";
import { orderItemSchema } from "./order-items";

// Mirrors the Prisma OrderStatus enum, but defined independently — this
// package stays DB-agnostic (apps/web depends on it too, with no Prisma
// dependency of its own).
export const orderStatusSchema = z.enum([
  "NEW",
  "MEASUREMENT",
  "CALCULATED",
  "CONFIRMED",
  "PRODUCTION",
  "READY",
  "INSTALLATION",
  "COMPLETED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Validated as one query object via ZodValidationPipe, not parsed field by
// field in the controller — an invalid ?status= must 400, not 500.
export const listOrdersQuerySchema = paginationQuerySchema.extend({
  status: orderStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  notes: z.string().trim().max(2000).optional(),
});
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  customerId: z.string().min(1).optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  note: z.string().trim().max(500).optional(),
});
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

export const orderStatusHistoryEntrySchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  note: z.string().nullable(),
  changedByUserId: z.string().nullable(),
  createdAt: z.string(),
});
export type OrderStatusHistoryEntry = z.infer<typeof orderStatusHistoryEntrySchema>;

export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.number(),
  status: orderStatusSchema,
  notes: z.string().nullable(),
  customer: customerSchema.pick({ id: true, fullName: true, phone: true }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrderDto = z.infer<typeof orderSchema>;

export const orderDetailSchema = orderSchema.extend({
  customer: customerSchema,
  statusHistory: z.array(orderStatusHistoryEntrySchema),
  items: z.array(orderItemSchema),
});
export type OrderDetailDto = z.infer<typeof orderDetailSchema>;
