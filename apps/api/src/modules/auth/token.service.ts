import { randomUUID, createHash } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { PermissionKey } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";
import type { Env } from "../../config/env.schema";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AccessTokenPayload {
  userId: string;
  businessId: string;
  roleId: string;
  roleName: string;
  permissions: PermissionKey[];
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Access tokens are short-lived, stateless JWTs (Bearer header). Refresh
 * tokens are also JWTs (so signature/expiry are self-verifying) but are
 * additionally tracked server-side by jti, hashed, so logout/rotation
 * actually revokes them — a bare stateless refresh JWT can't be revoked
 * before it expires, which the brief's "production-ready" bar rules out.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwt.sign(
      { businessId: payload.businessId, roleId: payload.roleId, roleName: payload.roleName, permissions: payload.permissions },
      {
        subject: payload.userId,
        secret: this.config.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const jti = randomUUID();
    const token = this.jwt.sign(
      {},
      {
        subject: userId,
        jwtid: jti,
        secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }),
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return token;
  }

  /** Verifies + revokes the old token, issues a new one. Throws if invalid/reused/revoked. */
  async rotateRefreshToken(token: string): Promise<{ userId: string; newToken: string }> {
    const { userId, jti } = await this.verifyRefreshToken(token);

    await this.prisma.refreshToken.update({
      where: { id: jti },
      data: { revokedAt: new Date() },
    });

    const newToken = await this.issueRefreshToken(userId);
    return { userId, newToken };
  }

  /** Best-effort — used on logout. Never throws. */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const { jti } = await this.verifyRefreshToken(token);
      await this.prisma.refreshToken.update({
        where: { id: jti },
        data: { revokedAt: new Date() },
      });
    } catch {
      // already invalid/expired/unknown — nothing to revoke
    }
  }

  private async verifyRefreshToken(token: string): Promise<{ userId: string; jti: string }> {
    let decoded: { sub?: string; jti?: string };
    try {
      decoded = this.jwt.verify(token, { secret: this.config.get("JWT_REFRESH_SECRET", { infer: true }) });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (!decoded.sub || !decoded.jti) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: decoded.jti } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.tokenHash !== hashToken(token)) {
      throw new UnauthorizedException("Refresh token has been revoked or expired");
    }

    return { userId: decoded.sub, jti: decoded.jti };
  }
}
