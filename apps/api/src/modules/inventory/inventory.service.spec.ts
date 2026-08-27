import { BadRequestException } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { PrismaService } from "../../prisma/prisma.service";
import { LocationsService } from "../locations/locations.service";
import { ProfilesService } from "../catalog/profiles.service";
import { GlassService } from "../catalog/glass.service";
import { AccessoriesService } from "../catalog/accessories.service";

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: {
    inventoryItem: { findMany: jest.Mock; upsert: jest.Mock };
    stockMovement: { findMany: jest.Mock; create: jest.Mock };
    profile: { findMany: jest.Mock };
    glass: { findMany: jest.Mock };
    accessory: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let locations: { assertActiveInBusiness: jest.Mock };
  let profiles: { assertExists: jest.Mock };
  let glassSvc: { assertExists: jest.Mock };
  let accessories: { assertExists: jest.Mock };

  beforeEach(() => {
    prisma = {
      inventoryItem: { findMany: jest.fn(), upsert: jest.fn() },
      stockMovement: { findMany: jest.fn(), create: jest.fn() },
      profile: { findMany: jest.fn().mockResolvedValue([]) },
      glass: { findMany: jest.fn().mockResolvedValue([]) },
      accessory: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    };
    locations = { assertActiveInBusiness: jest.fn().mockResolvedValue({ id: "loc-1", isActive: true }) };
    profiles = { assertExists: jest.fn().mockResolvedValue({ id: "profile-1" }) };
    glassSvc = { assertExists: jest.fn().mockResolvedValue({ id: "glass-1" }) };
    accessories = { assertExists: jest.fn().mockResolvedValue({ id: "acc-1" }) };

    service = new InventoryService(
      prisma as unknown as PrismaService,
      locations as unknown as LocationsService,
      profiles as unknown as ProfilesService,
      glassSvc as unknown as GlassService,
      accessories as unknown as AccessoriesService,
    );
  });

  describe("recordMovement", () => {
    it("validates the material exists in this business before touching stock", async () => {
      profiles.assertExists.mockRejectedValue(new Error("Profile not found"));

      await expect(
        service.recordMovement("biz-1", "user-1", {
          locationId: "loc-1",
          materialType: "PROFILE",
          materialId: "profile-x",
          type: "RECEIVE",
          quantityDelta: 10,
        }),
      ).rejects.toThrow("Profile not found");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a SEAL movement whose materialId is not the literal "seal"', async () => {
      await expect(
        service.recordMovement("biz-1", "user-1", {
          locationId: "loc-1",
          materialType: "SEAL",
          materialId: "not-seal",
          type: "RECEIVE",
          quantityDelta: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("applies an atomic increment and records the movement", async () => {
      const upsert = jest.fn().mockResolvedValue({ quantity: 16.6 });
      const movementCreate = jest.fn().mockResolvedValue({ id: "mv-1" });
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ inventoryItem: { upsert }, stockMovement: { create: movementCreate } }),
      );

      await service.recordMovement("biz-1", "user-1", {
        locationId: "loc-1",
        materialType: "PROFILE",
        materialId: "profile-1",
        type: "RECEIVE",
        quantityDelta: 10,
      });

      expect(upsert).toHaveBeenCalledWith({
        where: { locationId_materialType_materialId: { locationId: "loc-1", materialType: "PROFILE", materialId: "profile-1" } },
        create: { locationId: "loc-1", materialType: "PROFILE", materialId: "profile-1", quantity: 10 },
        update: { quantity: { increment: 10 } },
      });
      expect(movementCreate).toHaveBeenCalledWith({
        data: {
          locationId: "loc-1",
          materialType: "PROFILE",
          materialId: "profile-1",
          type: "RECEIVE",
          quantityDelta: 10,
          note: undefined,
          changedByUserId: "user-1",
        },
      });
    });

    it("rejects an adjustment that would take the balance below zero", async () => {
      const upsert = jest.fn().mockResolvedValue({ quantity: -5 });
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ inventoryItem: { upsert }, stockMovement: { create: jest.fn() } }),
      );

      await expect(
        service.recordMovement("biz-1", "user-1", {
          locationId: "loc-1",
          materialType: "PROFILE",
          materialId: "profile-1",
          type: "ADJUSTMENT",
          quantityDelta: -5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("consumeForOrder", () => {
    const requirements = [
      { materialType: "PROFILE" as const, materialId: "profile-1", label: "Profile — Frame", quantity: 6.6 },
      { materialType: "SEAL" as const, materialId: "seal", label: "Rubber/seal", quantity: 6.6 },
    ];

    it("throws one combined message listing every shortfall, without writing anything", async () => {
      const findMany = jest.fn().mockResolvedValue([{ materialType: "PROFILE", materialId: "profile-1", quantity: 2 }]);
      const upsert = jest.fn();
      const tx = { inventoryItem: { findMany, upsert }, stockMovement: { create: jest.fn() } };

      await expect(
        service.consumeForOrder(tx as never, "biz-1", "loc-1", "order-1", "user-1", requirements),
      ).rejects.toThrow(/Frame short by 4.6 M.*Rubber\/seal short by 6.6 M/);
      expect(upsert).not.toHaveBeenCalled();
    });

    it("decrements every material and writes one PRODUCTION_CONSUME movement each when stock is sufficient", async () => {
      const findMany = jest.fn().mockResolvedValue([
        { materialType: "PROFILE", materialId: "profile-1", quantity: 20 },
        { materialType: "SEAL", materialId: "seal", quantity: 20 },
      ]);
      const upsert = jest.fn().mockResolvedValue({ quantity: 13.4 });
      const movementCreate = jest.fn().mockResolvedValue({});
      const tx = { inventoryItem: { findMany, upsert }, stockMovement: { create: movementCreate } };

      await service.consumeForOrder(tx as never, "biz-1", "loc-1", "order-1", "user-1", requirements);

      expect(upsert).toHaveBeenCalledTimes(2);
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { quantity: { increment: -6.6 } } }),
      );
      expect(movementCreate).toHaveBeenCalledWith({
        data: {
          locationId: "loc-1",
          materialType: "PROFILE",
          materialId: "profile-1",
          type: "PRODUCTION_CONSUME",
          quantityDelta: -6.6,
          orderId: "order-1",
          changedByUserId: "user-1",
        },
      });
    });
  });
});
