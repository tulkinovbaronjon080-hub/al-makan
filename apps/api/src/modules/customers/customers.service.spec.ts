import { ConflictException, NotFoundException } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("CustomersService", () => {
  let service: CustomersService;
  let prisma: {
    customer: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new CustomersService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("rejects a duplicate phone number within the same business", async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        service.create("biz-1", { fullName: "Bob", phone: "+998901234567" }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.customer.create).not.toHaveBeenCalled();
    });

    it("creates a customer when the phone is free", async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockResolvedValue({ id: "cust-1" });

      const result = await service.create("biz-1", { fullName: "Bob", phone: "+998901234567" });

      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { businessId: "biz-1", fullName: "Bob", phone: "+998901234567" },
      });
      expect(result).toEqual({ id: "cust-1" });
    });
  });

  describe("getOne", () => {
    it("404s for a customer belonging to a different business", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.getOne("biz-1", "cust-in-biz-2")).rejects.toThrow(NotFoundException);
      expect(prisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "cust-in-biz-2", businessId: "biz-1" } }),
      );
    });
  });
});
