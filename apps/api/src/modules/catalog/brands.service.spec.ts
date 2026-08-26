import { ConflictException, NotFoundException } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("BrandsService", () => {
  let service: BrandsService;
  let prisma: {
    brand: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      brand: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    service = new BrandsService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("rejects a duplicate name within the same business", async () => {
      prisma.brand.findUnique.mockResolvedValue({ id: "existing" });

      await expect(service.create("biz-1", { name: "AKFA" })).rejects.toThrow(ConflictException);
      expect(prisma.brand.create).not.toHaveBeenCalled();
    });

    it("creates a brand when the name is free", async () => {
      prisma.brand.findUnique.mockResolvedValue(null);
      prisma.brand.create.mockResolvedValue({ id: "brand-1", name: "AKFA" });

      const result = await service.create("biz-1", { name: "AKFA" });

      expect(prisma.brand.create).toHaveBeenCalledWith({ data: { businessId: "biz-1", name: "AKFA" } });
      expect(result).toEqual({ id: "brand-1", name: "AKFA" });
    });
  });

  describe("update", () => {
    it("404s for a brand belonging to a different business", async () => {
      prisma.brand.findFirst.mockResolvedValue(null);

      await expect(service.update("biz-1", "brand-in-biz-2", { name: "New" })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.brand.findFirst).toHaveBeenCalledWith({
        where: { id: "brand-in-biz-2", businessId: "biz-1" },
      });
    });

    it("allows renaming to its own current name (excludes itself from the conflict check)", async () => {
      prisma.brand.findFirst.mockResolvedValue({ id: "brand-1", businessId: "biz-1", name: "AKFA" });
      prisma.brand.findUnique.mockResolvedValue({ id: "brand-1", name: "AKFA" });
      prisma.brand.update.mockResolvedValue({ id: "brand-1", name: "AKFA", isActive: false });

      await expect(service.update("biz-1", "brand-1", { name: "AKFA", isActive: false })).resolves.toBeDefined();
      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id: "brand-1" },
        data: { name: "AKFA", isActive: false },
      });
    });
  });
});
