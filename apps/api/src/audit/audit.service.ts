import { Injectable } from "@nestjs/common";
import type { Prisma } from "@al-makan/database";
import { PrismaService } from "../prisma/prisma.service";

export interface WriteAuditLogInput {
  businessId?: string;
  actorUserId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Minimal audit trail — written on sensitive operations (login, register,
 * role/status changes) per brief §33. Not yet browsable; a viewer UI is
 * Phase 11/Reports territory, but the write path is complete on its own.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: WriteAuditLogInput) {
    await this.prisma.auditLog.create({
      data: {
        businessId: input.businessId,
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata,
      },
    });
  }
}
