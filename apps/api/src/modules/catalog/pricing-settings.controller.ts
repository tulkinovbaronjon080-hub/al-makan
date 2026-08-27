import { Body, Controller, Get, Patch } from "@nestjs/common";
import { updatePricingSettingsSchema, type UpdatePricingSettingsDto } from "@al-makan/types";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { PricingSettingsService } from "./pricing-settings.service";

// GET is catalog.view (not just catalog.manage) — the configurator's live
// price preview needs these rates, and catalog.view roles (SALES,
// MEASUREMENT) already see raw material prices for the same reason.
@Controller("pricing-settings")
export class PricingSettingsController {
  constructor(private readonly settings: PricingSettingsService) {}

  @RequirePermissions("catalog.view")
  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.settings.get(user.businessId);
  }

  @RequirePermissions("catalog.manage")
  @Patch()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updatePricingSettingsSchema)) body: UpdatePricingSettingsDto,
  ) {
    return this.settings.update(user.businessId, body);
  }
}
