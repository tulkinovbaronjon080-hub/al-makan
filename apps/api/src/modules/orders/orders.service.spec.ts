import { NotFoundException } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: {
    customer: { findFirst: jest.Mock };
    order: { findFirst: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      customer: { findFirst: jest.fn() },
      order: { findFirst: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new OrdersService(prisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("rejects a customer that doesn't belong to this business", async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create("biz-1", "user-1", { customerId: "cust-x" }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("assigns the pre-increment order number and records the initial NEW status", async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: "cust-1", businessId: "biz-1" });

      const businessUpdate = jest.fn().mockResolvedValue({ nextOrderNumber: 2 }); // was 1, now 2
      const orderCreate = jest.fn().mockResolvedValue({ id: "order-1", orderNumber: 1 });
      const historyCreate = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          business: { update: businessUpdate },
          order: { create: orderCreate },
          orderStatusHistory: { create: historyCreate },
        }),
      );

      const result = await service.create("biz-1", "user-1", { customerId: "cust-1", notes: "urgent" });

      expect(orderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ businessId: "biz-1", orderNumber: 1, customerId: "cust-1" }),
        }),
      );
      expect(historyCreate).toHaveBeenCalledWith({
        data: { orderId: "order-1", status: "NEW", changedByUserId: "user-1" },
      });
      expect(result).toEqual({ id: "order-1", orderNumber: 1 });
    });
  });

  describe("updateStatus", () => {
    it("rejects an order that doesn't belong to this business", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.updateStatus("biz-1", "order-x", "user-1", "READY")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("updates the order and appends a status history row", async () => {
      prisma.order.findFirst.mockResolvedValue({ id: "order-1", businessId: "biz-1" });

      const orderUpdate = jest.fn().mockResolvedValue({ id: "order-1", status: "READY" });
      const historyCreate = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({ order: { update: orderUpdate }, orderStatusHistory: { create: historyCreate } }),
      );

      await service.updateStatus("biz-1", "order-1", "user-1", "READY", "picked up materials");

      expect(orderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "order-1" }, data: { status: "READY" } }),
      );
      expect(historyCreate).toHaveBeenCalledWith({
        data: { orderId: "order-1", status: "READY", changedByUserId: "user-1", note: "picked up materials" },
      });
    });
  });
});
