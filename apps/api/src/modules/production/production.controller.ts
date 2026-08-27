import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { advanceProductionStageSchema, type AdvanceProductionStageDto } from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { ProductionService } from "./production.service";

@Controller("production")
export class ProductionController {
  constructor(private readonly production: ProductionService) {}

  @RequirePermissions("orders.edit")
  @Post("orders/:orderId/start")
  startProduction(@CurrentUser() user: AuthenticatedUser, @Param("orderId") orderId: string) {
    return this.production.startProduction(user.businessId, orderId, user.userId);
  }

  @RequirePermissions("production.manage")
  @Get("queue")
  listQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.production.listQueue(user.businessId);
  }

  @RequirePermissions("production.manage")
  @Get("materials")
  getMaterialRequirements(@CurrentUser() user: AuthenticatedUser) {
    return this.production.getMaterialRequirements(user.businessId);
  }

  @RequirePermissions("production.manage")
  @Patch("tasks/:taskId/stage")
  advanceStage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("taskId") taskId: string,
    @Body(new ZodValidationPipe(advanceProductionStageSchema)) body: AdvanceProductionStageDto,
  ) {
    return this.production.advanceStage(user.businessId, taskId, user.userId, body.stage);
  }
}
