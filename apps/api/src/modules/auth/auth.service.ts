import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthResponse, LoginDto, MeResponse, PermissionKey, RegisterDto } from "@al-makan/types";
import type { Business, Role, User } from "@al-makan/database";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import type { AuthenticatedUser } from "../../common/authenticated-user";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

type AuthResult = AuthResponse & { refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    // Compound-unique where doesn't accept null for businessId — see seed.ts.
    const ownerRole = await this.prisma.role.findFirst({
      where: { businessId: null, name: "OWNER" },
    });
    if (!ownerRole) {
      throw new InternalServerErrorException("System roles are not seeded — run `pnpm db:seed`");
    }

    const passwordHash = await this.password.hash(dto.password);
    const slug = await this.generateUniqueSlug(dto.businessName);

    const { user, business } = await this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({ data: { name: dto.businessName, slug } });
      const user = await tx.user.create({
        data: { email: dto.email, phone: dto.phone, fullName: dto.fullName, passwordHash },
      });
      await tx.businessMember.create({
        data: { businessId: business.id, userId: user.id, roleId: ownerRole.id, status: "ACTIVE" },
      });
      return { user, business };
    });

    await this.audit.write({
      businessId: business.id,
      actorUserId: user.id,
      action: "auth.register",
      targetType: "Business",
      targetId: business.id,
    });

    return this.issueSession(user, business, ownerRole);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const valid = user ? await this.password.compare(dto.password, user.passwordHash) : false;

    if (!user || !valid) {
      await this.audit.write({
        actorUserId: user?.id,
        action: "auth.login_failed",
        targetType: "User",
        targetId: user?.id,
        metadata: { email: dto.email },
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    const member = await this.prisma.businessMember.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { joinedAt: "asc" },
      include: { business: true, role: true },
    });
    if (!member) {
      throw new UnauthorizedException("This account has no active business membership");
    }

    await this.audit.write({
      businessId: member.businessId,
      actorUserId: user.id,
      action: "auth.login",
      targetType: "User",
      targetId: user.id,
    });

    return this.issueSession(user, member.business, member.role);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const { userId, newToken } = await this.tokens.rotateRefreshToken(refreshToken);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const member = user
      ? await this.prisma.businessMember.findFirst({
          where: { userId: user.id, status: "ACTIVE" },
          orderBy: { joinedAt: "asc" },
          include: { business: true, role: true },
        })
      : null;

    if (!user || !member) {
      throw new UnauthorizedException("Account or business membership no longer exists");
    }

    return this.issueSession(user, member.business, member.role, newToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(refreshToken);
  }

  async me(authUser: AuthenticatedUser): Promise<MeResponse> {
    const member = await this.prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: authUser.businessId, userId: authUser.userId } },
      include: { user: true, business: true, role: true },
    });
    if (!member) {
      throw new UnauthorizedException("Business membership no longer exists");
    }

    const permissions = await this.loadRolePermissions(member.role.id);

    return {
      user: {
        id: member.user.id,
        email: member.user.email,
        fullName: member.user.fullName,
        phone: member.user.phone,
      },
      business: { id: member.business.id, name: member.business.name, slug: member.business.slug },
      role: { id: member.role.id, name: member.role.name },
      permissions,
    };
  }

  private async issueSession(
    user: User,
    business: Business,
    role: Role,
    existingRefreshToken?: string,
  ): Promise<AuthResult> {
    const permissions = await this.loadRolePermissions(role.id);
    const accessToken = this.tokens.signAccessToken({
      userId: user.id,
      businessId: business.id,
      roleId: role.id,
      roleName: role.name,
      permissions,
    });
    const refreshToken = existingRefreshToken ?? (await this.tokens.issueRefreshToken(user.id));

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone },
      business: { id: business.id, name: business.name, slug: business.slug },
      role: { id: role.id, name: role.name },
      permissions,
    };
  }

  private async loadRolePermissions(roleId: string): Promise<PermissionKey[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rows.map((r) => r.permission.key as PermissionKey);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "business";

    let slug = base;
    let suffix = 1;
    while (await this.prisma.business.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }
}
