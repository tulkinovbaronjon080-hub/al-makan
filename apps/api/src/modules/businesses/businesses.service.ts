import { Injectable, NotFoundException } from "@nestjs/common";
import type { UpdateBusinessDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCurrent(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException("Business not found");
    }
    return business;
  }

  async update(businessId: string, actorUserId: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.update({
      where: { id: businessId },
      data: { name: dto.name },
    });

    await this.audit.write({
      businessId,
      actorUserId,
      action: "business.update",
      targetType: "Business",
      targetId: businessId,
      metadata: dto,
    });

    return business;
  }
}
