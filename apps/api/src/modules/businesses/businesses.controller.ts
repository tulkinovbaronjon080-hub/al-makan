import { Body, Controller, Get, Patch } from "@nestjs/common";
import { updateBusinessSchema, type UpdateBusinessDto } from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { BusinessesService } from "./businesses.service";

@Controller("businesses")
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get("me")
  getCurrent(@CurrentUser() user: AuthenticatedUser) {
    return this.businesses.getCurrent(user.businessId);
  }

  @RequirePermissions("business.manage")
  @Patch("me")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateBusinessSchema)) body: UpdateBusinessDto,
  ) {
    return this.businesses.update(user.businessId, user.userId, body);
  }
}
