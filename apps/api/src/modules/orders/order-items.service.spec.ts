import { BadRequestException, NotFoundException } from "@nestjs/common";
import { calculateProductConfiguration } from "@al-makan/calculation-engine";
import { OrderItemsService } from "./order-items.service";
import { OrdersService } from "./orders.service";
import { ProfilesService } from "../catalog/profiles.service";
import { GlassService } from "../catalog/glass.service";
import { ColorsService } from "../catalog/colors.service";
import { AccessoriesService } from "../catalog/accessories.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("OrderItemsService", () => {
  let service: OrderItemsService;
  let prisma: { orderItem: { create: jest.Mock; findFirst: jest.Mock; delete: jest.Mock } };
  let orders: { assertOrderInBusiness: jest.Mock };
  let profiles: { assertExists: jest.Mock };
  let glass: { assertExists: jest.Mock };
  let colors: { assertExists: jest.Mock };
  let accessories: { assertAllActiveAndInBusiness: jest.Mock };

  const dto = {
    productType: "WINDOW" as const,
    widthMm: 1500,
    heightMm: 1200,
    sections: 2,
    openingDirection: "LEFT_HINGED" as const,
    profileId: "profile-1",
    glassId: "glass-1",
    colorId: "color-1",
    accessoryIds: ["acc-1"],
    quantity: 1,
  };

  beforeEach(() => {
    prisma = { orderItem: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn() } };
    orders = { assertOrderInBusiness: jest.fn().mockResolvedValue({ id: "order-1" }) };
    profiles = { assertExists: jest.fn().mockResolvedValue({ id: "profile-1", isActive: true }) };
    glass = { assertExists: jest.fn().mockResolvedValue({ id: "glass-1", isActive: true }) };
    colors = { assertExists: jest.fn().mockResolvedValue({ id: "color-1", isActive: true }) };
    accessories = { assertAllActiveAndInBusiness: jest.fn().mockResolvedValue(undefined) };

    service = new OrderItemsService(
      prisma as unknown as PrismaService,
      orders as unknown as OrdersService,
      profiles as unknown as ProfilesService,
      glass as unknown as GlassService,
      colors as unknown as ColorsService,
      accessories as unknown as AccessoriesService,
    );
  });

  describe("create", () => {
    it("rejects when the order doesn't belong to this business", async () => {
      orders.assertOrderInBusiness.mockRejectedValue(new NotFoundException("Order not found"));

      await expect(service.create("biz-1", "order-in-biz-2", dto)).rejects.toThrow(NotFoundException);
      expect(prisma.orderItem.create).not.toHaveBeenCalled();
    });

    it("rejects when the profile doesn't belong to this business", async () => {
      profiles.assertExists.mockRejectedValue(new NotFoundException("Profile not found"));

      await expect(service.create("biz-1", "order-1", dto)).rejects.toThrow(NotFoundException);
      expect(prisma.orderItem.create).not.toHaveBeenCalled();
    });

    it("rejects when the profile is inactive", async () => {
      profiles.assertExists.mockResolvedValue({ id: "profile-1", isActive: false });

      await expect(service.create("biz-1", "order-1", dto)).rejects.toThrow(BadRequestException);
      expect(prisma.orderItem.create).not.toHaveBeenCalled();
    });

    it("rejects when an accessory is invalid or belongs to a different business", async () => {
      accessories.assertAllActiveAndInBusiness.mockRejectedValue(
        new BadRequestException("One or more accessories are invalid or unavailable"),
      );

      await expect(service.create("biz-1", "order-1", dto)).rejects.toThrow(BadRequestException);
      expect(prisma.orderItem.create).not.toHaveBeenCalled();
    });

    it("persists exactly what calculateProductConfiguration returns for these inputs", async () => {
      prisma.orderItem.create.mockImplementation(async ({ data }) => ({ id: "item-1", ...data }));

      const expected = calculateProductConfiguration({
        productType: dto.productType,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        sections: dto.sections,
        profileId: dto.profileId,
        glassId: dto.glassId,
        colorId: dto.colorId,
        accessoryIds: dto.accessoryIds,
        quantity: dto.quantity,
      });

      const result = await service.create("biz-1", "order-1", dto);

      expect(result.materialCost).toBe(expected.materialCost);
      expect(result.totalCost).toBe(expected.totalCost);
      expect(result.sellingPrice).toBe(expected.sellingPrice);
      expect(result.bom).toEqual(expected.bom);
      expect(prisma.orderItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ orderId: "order-1", profileId: "profile-1" }) }),
      );
    });
  });

  describe("remove", () => {
    it("404s when the item doesn't belong to this order", async () => {
      prisma.orderItem.findFirst.mockResolvedValue(null);

      await expect(service.remove("biz-1", "order-1", "item-in-another-order")).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.orderItem.delete).not.toHaveBeenCalled();
    });
  });
});
