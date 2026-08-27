import { BadRequestException, NotFoundException } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("LocationsService", () => {
  let service: LocationsService;
  let prisma: {
    location: { findFirst: jest.Mock; findMany: jest.Mock; count: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      location: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    service = new LocationsService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("creates a location scoped to the business", async () => {
      prisma.location.create.mockResolvedValue({ id: "loc-1", name: "Main warehouse", type: "WAREHOUSE" });

      const result = await service.create("biz-1", { name: "Main warehouse", type: "WAREHOUSE" });

      expect(prisma.location.create).toHaveBeenCalledWith({
        data: { businessId: "biz-1", name: "Main warehouse", type: "WAREHOUSE" },
      });
      expect(result).toEqual({ id: "loc-1", name: "Main warehouse", type: "WAREHOUSE" });
    });
  });

  describe("update", () => {
    it("404s for a location belonging to a different business", async () => {
      prisma.location.findFirst.mockResolvedValue(null);

      await expect(service.update("biz-1", "loc-in-biz-2", { name: "New" })).rejects.toThrow(NotFoundException);
      expect(prisma.location.update).not.toHaveBeenCalled();
    });
  });

  describe("assertActiveInBusiness", () => {
    it("404s for a location belonging to a different business", async () => {
      prisma.location.findFirst.mockResolvedValue(null);

      await expect(service.assertActiveInBusiness("biz-1", "loc-x")).rejects.toThrow(NotFoundException);
    });

    it("rejects a disabled location", async () => {
      prisma.location.findFirst.mockResolvedValue({ id: "loc-1", businessId: "biz-1", isActive: false });

      await expect(service.assertActiveInBusiness("biz-1", "loc-1")).rejects.toThrow(BadRequestException);
    });

    it("returns the location when active and in business", async () => {
      const location = { id: "loc-1", businessId: "biz-1", isActive: true };
      prisma.location.findFirst.mockResolvedValue(location);

      await expect(service.assertActiveInBusiness("biz-1", "loc-1")).resolves.toEqual(location);
    });
  });
});
