import { Module } from "@nestjs/common";
import { LocationsController } from "./locations.controller";
import { LocationsService } from "./locations.service";

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
  // InventoryService needs this to validate a locationId belongs to the
  // business and is active before touching stock.
  exports: [LocationsService],
})
export class LocationsModule {}
