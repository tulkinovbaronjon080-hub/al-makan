import { NotFoundException } from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { ProfileSeriesService } from "./profile-series.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("ProfilesService", () => {
  let service: ProfilesService;
  let prisma: {
    profile: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let series: { assertExists: jest.Mock };

  beforeEach(() => {
    prisma = {
      profile: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    series = { assertExists: jest.fn() };
    service = new ProfilesService(prisma as unknown as PrismaService, series as unknown as ProfileSeriesService);
  });

  describe("create", () => {
    it("rejects when the parent series doesn't belong to this business", async () => {
      series.assertExists.mockRejectedValue(new NotFoundException("Profile series not found"));

      await expect(
        service.create("biz-1", { seriesId: "series-in-biz-2", name: "Frame", pricePerMeter: 45000 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.profile.create).not.toHaveBeenCalled();
    });

    it("creates a profile once the parent series is confirmed in-business", async () => {
      series.assertExists.mockResolvedValue({ id: "series-1", businessId: "biz-1" });
      prisma.profile.findUnique.mockResolvedValue(null);
      prisma.profile.create.mockResolvedValue({ id: "profile-1", name: "Frame", pricePerMeter: 45000 });

      const result = await service.create("biz-1", { seriesId: "series-1", name: "Frame", pricePerMeter: 45000 });

      expect(series.assertExists).toHaveBeenCalledWith("biz-1", "series-1");
      expect(result).toEqual({ id: "profile-1", name: "Frame", pricePerMeter: 45000 });
    });
  });

  describe("update", () => {
    it("404s for a profile belonging to a different business", async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.update("biz-1", "profile-in-biz-2", { pricePerMeter: 50000 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
