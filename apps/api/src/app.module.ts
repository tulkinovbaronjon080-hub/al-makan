import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BusinessesModule } from "./modules/businesses/businesses.module";
import { UsersModule } from "./modules/users/users.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { ProductionModule } from "./modules/production/production.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { validateEnv } from "./config/env.schema";

// Domain modules (inventory, store, ...) register here starting Phase 7+,
// one at a time, per the roadmap — folders already exist under src/modules/
// (see src/modules/README.md).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuditModule,
    AuthModule,
    BusinessesModule,
    UsersModule,
    CustomersModule,
    OrdersModule,
    CatalogModule,
    ProductionModule,
  ],
  providers: [
    // JwtAuthGuard first (authenticates → sets request.user), then
    // PermissionsGuard (authorizes using request.user), then throttling.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
