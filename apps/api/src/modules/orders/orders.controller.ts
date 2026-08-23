import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  type CreateOrderDto,
  type ListOrdersQuery,
  type UpdateOrderDto,
  type UpdateOrderStatusDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @RequirePermissions("orders.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrderDto) {
    return this.orders.create(user.businessId, user.userId, body);
  }

  @RequirePermissions("orders.view")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listOrdersQuerySchema)) query: ListOrdersQuery,
  ) {
    return this.orders.list(user.businessId, query, query.status, query.search);
  }

  @RequirePermissions("orders.view")
  @Get(":id")
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.orders.getOne(user.businessId, id);
  }

  @RequirePermissions("orders.edit")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOrderSchema)) body: UpdateOrderDto,
  ) {
    return this.orders.update(user.businessId, id, body);
  }

  @RequirePermissions("orders.edit")
  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user.businessId, id, user.userId, body.status, body.note);
  }
}
