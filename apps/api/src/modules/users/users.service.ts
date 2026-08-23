import { Injectable, NotFoundException } from "@nestjs/common";
import type { BusinessMemberDto, PaginationQuery } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";

function toDto(member: {
  id: string;
  userId: string;
  roleId: string;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  joinedAt: Date;
  user: { fullName: string; email: string; phone: string | null };
  role: { name: string };
}): BusinessMemberDto {
  return {
    id: member.id,
    userId: member.userId,
    fullName: member.user.fullName,
    email: member.user.email,
    phone: member.user.phone,
    roleId: member.roleId,
    roleName: member.role.name,
    status: member.status,
    joinedAt: member.joinedAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(businessId: string, pagination: PaginationQuery) {
    const where = { businessId };
    const [rows, total] = await Promise.all([
      this.prisma.businessMember.findMany({
        where,
        include: { user: true, role: true },
        orderBy: { joinedAt: "asc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.businessMember.count({ where }),
    ]);

    return {
      items: rows.map(toDto),
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
    };
  }

  async getOne(businessId: string, memberId: string): Promise<BusinessMemberDto> {
    const member = await this.findMemberInBusiness(businessId, memberId);
    return toDto(member);
  }

  async updateRole(businessId: string, memberId: string, actorUserId: string, roleId: string) {
    await this.findMemberInBusiness(businessId, memberId);

    // A role must be a system role or belong to this business — never let
    // one business assign a member a role scoped to a different business.
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, OR: [{ businessId: null }, { businessId }] },
    });
    if (!role) {
      throw new NotFoundException("Role not found for this business");
    }

    const updated = await this.prisma.businessMember.update({
      where: { id: memberId },
      data: { roleId },
      include: { user: true, role: true },
    });

    await this.audit.write({
      businessId,
      actorUserId,
      action: "member.role_updated",
      targetType: "BusinessMember",
      targetId: memberId,
      metadata: { roleId },
    });

    return toDto(updated);
  }

  async updateStatus(
    businessId: string,
    memberId: string,
    actorUserId: string,
    status: "ACTIVE" | "INVITED" | "DISABLED",
  ) {
    await this.findMemberInBusiness(businessId, memberId);

    const updated = await this.prisma.businessMember.update({
      where: { id: memberId },
      data: { status },
      include: { user: true, role: true },
    });

    await this.audit.write({
      businessId,
      actorUserId,
      action: "member.status_updated",
      targetType: "BusinessMember",
      targetId: memberId,
      metadata: { status },
    });

    return toDto(updated);
  }

  private async findMemberInBusiness(businessId: string, memberId: string) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, businessId },
      include: { user: true, role: true },
    });
    if (!member) {
      throw new NotFoundException("Business member not found");
    }
    return member;
  }
}
