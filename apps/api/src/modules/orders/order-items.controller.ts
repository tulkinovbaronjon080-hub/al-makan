import { Body, Controller, Delete, HttpCode, Param, Post } from "@nestjs/common";
import { createOrderItemSchema, type CreateOrderItemDto } from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { OrderItemsService } from "./order-items.service";

@Controller("orders/:orderId/items")
export class OrderItemsController {
  constructor(private readonly items: OrderItemsService) {}

  @RequirePermissions("orders.edit")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
    @Body(new ZodValidationPipe(createOrderItemSchema)) body: CreateOrderItemDto,
  ) {
    return this.items.create(user.businessId, orderId, body);
  }

  @RequirePermissions("orders.edit")
  @HttpCode(204)
  @Delete(":itemId")
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
    @Param("itemId") itemId: string,
  ) {
    return this.items.remove(user.businessId, orderId, itemId);
  }
}
