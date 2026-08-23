import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { TokenService } from "./token.service";
import type { PrismaService } from "../../prisma/prisma.service";
import type { Env } from "../../config/env.schema";

function fakeConfig(values: Record<string, string>): ConfigService<Env, true> {
  return { get: (key: string) => values[key] } as unknown as ConfigService<Env, true>;
}

describe("TokenService", () => {
  let prisma: {
    refreshToken: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
  };
  let service: TokenService;
  const config = fakeConfig({
    JWT_ACCESS_SECRET: "access-secret-access-secret-1234",
    JWT_REFRESH_SECRET: "refresh-secret-refresh-secret-5678",
  });

  beforeEach(() => {
    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
      },
    };
    service = new TokenService(new JwtService({}), config, prisma as unknown as PrismaService);
  });

  it("signs an access token carrying the expected claims", () => {
    const token = service.signAccessToken({
      userId: "user-1",
      businessId: "biz-1",
      roleId: "role-1",
      roleName: "OWNER",
      permissions: ["business.manage"],
    });

    const decoded = new JwtService({}).decode(token) as {
      sub: string;
      businessId: string;
      permissions: string[];
    };
    expect(decoded.sub).toBe("user-1");
    expect(decoded.businessId).toBe("biz-1");
    expect(decoded.permissions).toEqual(["business.manage"]);
  });

  it("issues a refresh token and stores its hash, not the raw token", async () => {
    const token = await service.issueRefreshToken("user-1");

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1" }) }),
    );
    const stored = prisma.refreshToken.create.mock.calls[0][0].data;
    expect(stored.tokenHash).not.toBe(token);
    expect(typeof token).toBe("string");
  });

  it("rotates a valid refresh token: revokes the old one, issues a new one", async () => {
    const token = await service.issueRefreshToken("user-1");
    const stored = prisma.refreshToken.create.mock.calls[0][0].data;

    prisma.refreshToken.findUnique.mockResolvedValue({
      id: stored.id,
      userId: "user-1",
      tokenHash: stored.tokenHash,
      expiresAt: new Date(Date.now() + 1_000_000),
      revokedAt: null,
    });

    const { userId, newToken } = await service.rotateRefreshToken(token);

    expect(userId).toBe("user-1");
    expect(newToken).not.toBe(token);
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: stored.id },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("rejects a refresh token that has already been revoked", async () => {
    const token = await service.issueRefreshToken("user-1");
    const stored = prisma.refreshToken.create.mock.calls[0][0].data;

    prisma.refreshToken.findUnique.mockResolvedValue({
      id: stored.id,
      userId: "user-1",
      tokenHash: stored.tokenHash,
      expiresAt: new Date(Date.now() + 1_000_000),
      revokedAt: new Date(),
    });

    await expect(service.rotateRefreshToken(token)).rejects.toThrow(UnauthorizedException);
  });

  it("rejects an unknown/tampered refresh token", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    await expect(service.rotateRefreshToken("not-a-real-token")).rejects.toThrow(UnauthorizedException);
  });
});
