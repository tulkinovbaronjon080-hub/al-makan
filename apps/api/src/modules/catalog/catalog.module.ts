import { Module } from "@nestjs/common";
import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";
import { ProfileSeriesController } from "./profile-series.controller";
import { ProfileSeriesService } from "./profile-series.service";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { GlassController } from "./glass.controller";
import { GlassService } from "./glass.service";
import { ColorsController } from "./colors.controller";
import { ColorsService } from "./colors.service";
import { AccessoriesController } from "./accessories.controller";
import { AccessoriesService } from "./accessories.service";
import { PricingSettingsController } from "./pricing-settings.controller";
import { PricingSettingsService } from "./pricing-settings.service";

@Module({
  controllers: [
    BrandsController,
    ProfileSeriesController,
    ProfilesController,
    GlassController,
    ColorsController,
    AccessoriesController,
    PricingSettingsController,
  ],
  providers: [
    BrandsService,
    ProfileSeriesService,
    ProfilesService,
    GlassService,
    ColorsService,
    AccessoriesService,
    PricingSettingsService,
  ],
  // OrdersModule needs these to validate an OrderItem's profile/glass/
  // color/accessory selections belong to the business and to price it.
  exports: [ProfilesService, GlassService, ColorsService, AccessoriesService, PricingSettingsService],
})
export class CatalogModule {}
