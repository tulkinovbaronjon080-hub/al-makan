import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrderItemsController } from "./order-items.controller";
import { OrderItemsService } from "./order-items.service";

@Module({
  imports: [CatalogModule],
  controllers: [OrdersController, OrderItemsController],
  providers: [OrdersService, OrderItemsService],
})
export class OrdersModule {}
