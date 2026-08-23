import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";

// Domain modules (auth, orders, inventory, ...) register here starting
// Phase 1, one at a time, per the roadmap — folders already exist under
// src/modules/ (see src/modules/README.md) so each phase just wires one
// in without restructuring the tree.
@Module({
  imports: [PrismaModule, HealthModule],
})
export class AppModule {}
