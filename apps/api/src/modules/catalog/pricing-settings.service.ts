import { Injectable } from "@nestjs/common";
import type { UpdatePricingSettingsDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * One row per business — lazily created with schema defaults on first
 * access rather than backfilled via migration. Covers both new
 * registrations and businesses that predate this model (see the Phase 5
 * plan).
 */
@Injectable()
export class PricingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(businessId: string) {
    const existing = await this.prisma.pricingSettings.findUnique({ where: { businessId } });
    if (existing) return existing;
    return this.prisma.pricingSettings.create({ data: { businessId } });
  }

  async update(businessId: string, dto: UpdatePricingSettingsDto) {
    await this.get(businessId); // ensures a row exists before updating
    return this.prisma.pricingSettings.update({ where: { businessId }, data: dto });
  }
}
