import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductionService } from "./production.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("ProductionService", () => {
  let service: ProductionService;
  let prisma: {
    order: { findFirst: jest.Mock };
    productionTask: { findFirst: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      order: { findFirst: jest.fn() },
      productionTask: { findFirst: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new ProductionService(prisma as unknown as PrismaService);
  });

  describe("startProduction", () => {
    it("rejects an order that doesn't belong to this business", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.startProduction("biz-1", "order-x", "user-1")).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects an order that isn't CONFIRMED", async () => {
      prisma.order.findFirst.mockResolvedValue({ id: "order-1", status: "NEW", items: [{ id: "item-1" }] });

      await expect(service.startProduction("biz-1", "order-1", "user-1")).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects an order with no products", async () => {
      prisma.order.findFirst.mockResolvedValue({ id: "order-1", status: "CONFIRMED", items: [] });

      await expect(service.startProduction("biz-1", "order-1", "user-1")).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("creates one task per item and flips the order to PRODUCTION", async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: "order-1",
        status: "CONFIRMED",
        items: [{ id: "item-1" }, { id: "item-2" }],
      });

      const taskCreate = jest
        .fn()
        .mockResolvedValueOnce({ id: "task-1" })
        .mockResolvedValueOnce({ id: "task-2" });
      const taskHistoryCreate = jest.fn().mockResolvedValue({});
      const orderUpdate = jest.fn().mockResolvedValue({ id: "order-1", status: "PRODUCTION" });
      const orderHistoryCreate = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          productionTask: { create: taskCreate },
          productionTaskStageHistory: { create: taskHistoryCreate },
          order: { update: orderUpdate },
          orderStatusHistory: { create: orderHistoryCreate },
        }),
      );

      const result = await service.startProduction("biz-1", "order-1", "user-1");

      expect(taskCreate).toHaveBeenCalledTimes(2);
      expect(taskCreate).toHaveBeenCalledWith({ data: { orderItemId: "item-1" } });
      expect(taskCreate).toHaveBeenCalledWith({ data: { orderItemId: "item-2" } });
      expect(taskHistoryCreate).toHaveBeenCalledWith({
        data: { productionTaskId: "task-1", stage: "QUEUED", changedByUserId: "user-1" },
      });
      expect(orderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "order-1" }, data: { status: "PRODUCTION" } }),
      );
      expect(orderHistoryCreate).toHaveBeenCalledWith({
        data: { orderId: "order-1", status: "PRODUCTION", changedByUserId: "user-1" },
      });
      expect(result).toEqual({ id: "order-1", status: "PRODUCTION" });
    });
  });

  describe("advanceStage", () => {
    it("404s when the task doesn't belong to this business", async () => {
      prisma.productionTask.findFirst.mockResolvedValue(null);

      await expect(service.advanceStage("biz-1", "task-x", "user-1", "CUTTING")).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects skipping stages", async () => {
      prisma.productionTask.findFirst.mockResolvedValue({
        id: "task-1",
        stage: "QUEUED",
        orderItem: { orderId: "order-1" },
      });

      await expect(service.advanceStage("biz-1", "task-1", "user-1", "GLAZING")).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejects moving backward", async () => {
      prisma.productionTask.findFirst.mockResolvedValue({
        id: "task-1",
        stage: "ASSEMBLY",
        orderItem: { orderId: "order-1" },
      });

      await expect(service.advanceStage("biz-1", "task-1", "user-1", "CUTTING")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("advances one step and does not flip the order to READY when siblings aren't done", async () => {
      prisma.productionTask.findFirst.mockResolvedValue({
        id: "task-1",
        stage: "QUALITY_CHECK",
        orderItem: { orderId: "order-1" },
      });

      const taskUpdate = jest.fn().mockResolvedValue({ id: "task-1", stage: "DONE" });
      const taskHistoryCreate = jest.fn().mockResolvedValue({});
      const siblingFindMany = jest
        .fn()
        .mockResolvedValue([{ id: "task-1", stage: "DONE" }, { id: "task-2", stage: "CUTTING" }]);
      const orderUpdate = jest.fn();
      const orderHistoryCreate = jest.fn();

      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          productionTask: { update: taskUpdate, findMany: siblingFindMany },
          productionTaskStageHistory: { create: taskHistoryCreate },
          order: { update: orderUpdate },
          orderStatusHistory: { create: orderHistoryCreate },
        }),
      );

      const result = await service.advanceStage("biz-1", "task-1", "user-1", "DONE");

      expect(taskUpdate).toHaveBeenCalledWith({ where: { id: "task-1" }, data: { stage: "DONE" } });
      expect(orderUpdate).not.toHaveBeenCalled();
      expect(orderHistoryCreate).not.toHaveBeenCalled();
      expect(result).toEqual({ id: "task-1", stage: "DONE" });
    });

    it("flips the order to READY when the last task reaches DONE", async () => {
      prisma.productionTask.findFirst.mockResolvedValue({
        id: "task-2",
        stage: "QUALITY_CHECK",
        orderItem: { orderId: "order-1" },
      });

      const taskUpdate = jest.fn().mockResolvedValue({ id: "task-2", stage: "DONE" });
      const taskHistoryCreate = jest.fn().mockResolvedValue({});
      const siblingFindMany = jest
        .fn()
        .mockResolvedValue([{ id: "task-1", stage: "DONE" }, { id: "task-2", stage: "DONE" }]);
      const orderUpdate = jest.fn().mockResolvedValue({});
      const orderHistoryCreate = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          productionTask: { update: taskUpdate, findMany: siblingFindMany },
          productionTaskStageHistory: { create: taskHistoryCreate },
          order: { update: orderUpdate },
          orderStatusHistory: { create: orderHistoryCreate },
        }),
      );

      await service.advanceStage("biz-1", "task-2", "user-1", "DONE");

      expect(orderUpdate).toHaveBeenCalledWith({ where: { id: "order-1" }, data: { status: "READY" } });
      expect(orderHistoryCreate).toHaveBeenCalledWith({
        data: { orderId: "order-1", status: "READY", changedByUserId: "user-1" },
      });
    });
  });

  describe("getMaterialRequirements", () => {
    it("sums BOM quantities across active tasks, grouped by materialId", async () => {
      prisma.productionTask.findMany.mockResolvedValue([
        {
          orderItem: {
            bom: [
              { materialId: "profile-1", label: "Frame", quantity: 6.6, unit: "M" },
              { materialId: "seal", label: "Rubber seal", quantity: 6.6, unit: "M" },
            ],
          },
        },
        {
          orderItem: {
            bom: [
              { materialId: "profile-1", label: "Frame", quantity: 3.3, unit: "M" },
              { materialId: "acc-1", label: "Handle", quantity: 2, unit: "PCS" },
            ],
          },
        },
      ]);

      const result = await service.getMaterialRequirements("biz-1");

      expect(result).toEqual(
        expect.arrayContaining([
          { materialId: "profile-1", label: "Frame", quantity: 9.9, unit: "M" },
          { materialId: "seal", label: "Rubber seal", quantity: 6.6, unit: "M" },
          { materialId: "acc-1", label: "Handle", quantity: 2, unit: "PCS" },
        ]),
      );
      expect(result).toHaveLength(3);
    });
  });
});
