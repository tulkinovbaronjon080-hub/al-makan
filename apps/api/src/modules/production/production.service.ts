import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PRODUCTION_STAGE_SEQUENCE, type ProductionStage } from "@al-makan/types";
import type { BomLine } from "@al-makan/calculation-engine";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

const customerSummarySelect = { id: true, fullName: true, phone: true } as const;

/**
 * Reaches into `order`/`orderItem` rows directly rather than injecting
 * OrdersService, the same way OrderItemsService already does for everything
 * beyond its own tenant-scoping check. InventoryService IS injected — unlike
 * Orders, stock-balance invariants (never negative, always ledgered) are
 * real shared logic worth not duplicating, the same reasoning
 * OrderItemsService uses to inject the Catalog services.
 */
@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async startProduction(businessId: string, orderId: string, actorUserId: string, locationId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, businessId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (order.status !== "CONFIRMED") {
      throw new BadRequestException("Only a confirmed order can start production");
    }
    if (order.items.length === 0) {
      throw new BadRequestException("Order has no products to produce");
    }

    const requirements = this.aggregateBom(order.items.map((item) => item.bom as unknown as BomLine[]));

    return this.prisma.$transaction(async (tx) => {
      await this.inventory.consumeForOrder(tx, businessId, locationId, orderId, actorUserId, requirements);

      for (const item of order.items) {
        const task = await tx.productionTask.create({
          data: { orderItemId: item.id },
        });
        await tx.productionTaskStageHistory.create({
          data: { productionTaskId: task.id, stage: "QUEUED", changedByUserId: actorUserId },
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: "PRODUCTION" },
        include: { customer: { select: customerSummarySelect } },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "PRODUCTION", changedByUserId: actorUserId },
      });

      return updated;
    });
  }

  async advanceStage(businessId: string, taskId: string, actorUserId: string, targetStage: ProductionStage) {
    const task = await this.prisma.productionTask.findFirst({
      where: { id: taskId, orderItem: { order: { businessId } } },
      include: { orderItem: true },
    });
    if (!task) {
      throw new NotFoundException("Production task not found");
    }

    const currentIndex = PRODUCTION_STAGE_SEQUENCE.indexOf(task.stage);
    const targetIndex = PRODUCTION_STAGE_SEQUENCE.indexOf(targetStage);
    if (targetIndex !== currentIndex + 1) {
      throw new BadRequestException("Stages must be completed in order, one at a time");
    }

    const orderId = task.orderItem.orderId;

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.productionTask.update({
        where: { id: taskId },
        data: { stage: targetStage },
      });
      await tx.productionTaskStageHistory.create({
        data: { productionTaskId: taskId, stage: targetStage, changedByUserId: actorUserId },
      });

      if (targetStage === "DONE") {
        const siblingTasks = await tx.productionTask.findMany({
          where: { orderItem: { orderId } },
        });
        const allDone = siblingTasks.every((t) => t.stage === "DONE");
        if (allDone) {
          await tx.order.update({ where: { id: orderId }, data: { status: "READY" } });
          await tx.orderStatusHistory.create({
            data: { orderId, status: "READY", changedByUserId: actorUserId },
          });
        }
      }

      return updatedTask;
    });
  }

  async listQueue(businessId: string) {
    const tasks = await this.prisma.productionTask.findMany({
      where: { stage: { not: "DONE" }, orderItem: { order: { businessId } } },
      include: { orderItem: { include: { order: { include: { customer: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    return tasks.map((task) => ({
      taskId: task.id,
      stage: task.stage,
      orderId: task.orderItem.order.id,
      orderNumber: task.orderItem.order.orderNumber,
      customerName: task.orderItem.order.customer.fullName,
      productType: task.orderItem.productType,
      widthMm: task.orderItem.widthMm,
      heightMm: task.orderItem.heightMm,
      quantity: task.orderItem.quantity,
      createdAt: task.createdAt,
    }));
  }

  async getMaterialRequirements(businessId: string) {
    const tasks = await this.prisma.productionTask.findMany({
      where: { stage: { not: "DONE" }, orderItem: { order: { businessId } } },
      include: { orderItem: true },
    });

    return this.aggregateBom(tasks.map((task) => task.orderItem.bom as unknown as BomLine[]));
  }

  /**
   * Groups BOM lines by materialId and sums their quantities — shared by
   * getMaterialRequirements (across active tasks, business-wide) and
   * startProduction (across one order's items, to check against stock).
   * Rounded to avoid floating-point summation drift (e.g. 6.6 + 3.3 =
   * 9.899999999999999) surfacing raw on the shop floor / in a stock check.
   */
  private aggregateBom(bomLists: BomLine[][]) {
    const totals = new Map<string, BomLine>();
    for (const bom of bomLists) {
      for (const line of bom) {
        const existing = totals.get(line.materialId);
        if (existing) {
          existing.quantity += line.quantity;
        } else {
          totals.set(line.materialId, { ...line });
        }
      }
    }

    return [...totals.values()]
      .map((line) => ({ ...line, quantity: Math.round(line.quantity * 100) / 100 }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}
