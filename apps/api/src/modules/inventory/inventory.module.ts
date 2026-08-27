import { Module } from "@nestjs/common";
import { LocationsModule } from "../locations/locations.module";
import { CatalogModule } from "../catalog/catalog.module";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";

@Module({
  imports: [LocationsModule, CatalogModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  // ProductionModule needs this to check/consume stock when starting
  // production.
  exports: [InventoryService],
})
export class InventoryModule {}
