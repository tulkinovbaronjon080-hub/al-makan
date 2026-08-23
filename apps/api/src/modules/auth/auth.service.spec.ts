import { Test } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock };
    role: { findFirst: jest.Mock };
    business: { findUnique: jest.Mock };
    businessMember: { findFirst: jest.Mock; findUnique: jest.Mock };
    rolePermission: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let password: { hash: jest.Mock; compare: jest.Mock };
  let tokens: { signAccessToken: jest.Mock; issueRefreshToken: jest.Mock };
  let audit: { write: jest.Mock };

  const ownerRole = { id: "role-owner", businessId: null, name: "OWNER" };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      role: { findFirst: jest.fn() },
      business: { findUnique: jest.fn() },
      businessMember: { findFirst: jest.fn(), findUnique: jest.fn() },
      rolePermission: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    };
    password = { hash: jest.fn().mockResolvedValue("hashed"), compare: jest.fn() };
    tokens = {
      signAccessToken: jest.fn().mockReturnValue("access-token"),
      issueRefreshToken: jest.fn().mockResolvedValue("refresh-token"),
    };
    audit = { write: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: password },
        { provide: TokenService, useValue: tokens },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe("register", () => {
    it("rejects a duplicate email", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existing-user" });

      await expect(
        service.register({ businessName: "ABC", fullName: "A", email: "a@b.com", password: "password123" }),
      ).rejects.toThrow(ConflictException);
    });

    it("creates a business + owner and returns a session", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findFirst.mockResolvedValue(ownerRole);
      prisma.business.findUnique.mockResolvedValue(null); // slug is free
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          business: { create: jest.fn().mockResolvedValue({ id: "biz-1", name: "ABC", slug: "abc" }) },
          user: { create: jest.fn().mockResolvedValue({ id: "user-1", email: "a@b.com", fullName: "A", phone: null }) },
          businessMember: { create: jest.fn().mockResolvedValue({}) },
        }),
      );

      const result = await service.register({
        businessName: "ABC",
        fullName: "A",
        email: "a@b.com",
        password: "password123",
      });

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.role.name).toBe("OWNER");
      expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: "auth.register" }));
    });
  });

  describe("login", () => {
    const user = { id: "user-1", email: "a@b.com", fullName: "A", phone: null, passwordHash: "hashed" };

    it("rejects a wrong password", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      password.compare.mockResolvedValue(false);

      await expect(service.login({ email: "a@b.com", password: "wrong" })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: "auth.login_failed" }));
    });

    it("rejects an unknown email without leaking which part was wrong", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: "nobody@b.com", password: "x" })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("succeeds and returns a session for a valid password", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      password.compare.mockResolvedValue(true);
      prisma.businessMember.findFirst.mockResolvedValue({
        businessId: "biz-1",
        business: { id: "biz-1", name: "ABC", slug: "abc" },
        role: ownerRole,
      });

      const result = await service.login({ email: "a@b.com", password: "correct" });

      expect(result.accessToken).toBe("access-token");
      expect(result.business.id).toBe("biz-1");
      expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: "auth.login" }));
    });

    it("rejects a user with no active business membership", async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      password.compare.mockResolvedValue(true);
      prisma.businessMember.findFirst.mockResolvedValue(null);

      await expect(service.login({ email: "a@b.com", password: "correct" })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
