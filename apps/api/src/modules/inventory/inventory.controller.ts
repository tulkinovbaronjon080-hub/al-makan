import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
  getStockQuerySchema,
  listMovementsQuerySchema,
  recordMovementSchema,
  type GetStockQuery,
  type ListMovementsQuery,
  type RecordMovementDto,
} from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @RequirePermissions("inventory.view")
  @Get("stock")
  getStock(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(getStockQuerySchema)) query: GetStockQuery,
  ) {
    return this.inventory.getStock(user.businessId, query.locationId);
  }

  @RequirePermissions("inventory.view")
  @Get("movements")
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(listMovementsQuerySchema)) query: ListMovementsQuery,
  ) {
    return this.inventory.listMovements(user.businessId, query);
  }

  @RequirePermissions("inventory.adjust")
  @Post("movements")
  recordMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(recordMovementSchema)) body: RecordMovementDto,
  ) {
    return this.inventory.recordMovement(user.businessId, user.userId, body);
  }
}
