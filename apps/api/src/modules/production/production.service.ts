import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PRODUCTION_STAGE_SEQUENCE, type ProductionStage } from "@al-makan/types";
import type { BomLine } from "@al-makan/calculation-engine";
import { PrismaService } from "../../prisma/prisma.service";

const customerSummarySelect = { id: true, fullName: true, phone: true } as const;

/**
 * Self-contained module — only depends on PrismaService, same as every other
 * module. Reaches into `order`/`orderItem` rows directly rather than
 * injecting OrdersService, the same way OrderItemsService already does for
 * everything beyond its own tenant-scoping check.
 */
@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async startProduction(businessId: string, orderId: string, actorUserId: string) {
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

    return this.prisma.$transaction(async (tx) => {
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

    const totals = new Map<string, { materialId: string; label: string; quantity: number; unit: "M" | "M2" | "PCS" }>();
    for (const task of tasks) {
      const bom = task.orderItem.bom as unknown as BomLine[];
      for (const line of bom) {
        const existing = totals.get(line.materialId);
        if (existing) {
          existing.quantity += line.quantity;
        } else {
          totals.set(line.materialId, { ...line });
        }
      }
    }

    // Rounded to avoid floating-point summation drift (e.g. 6.6 + 3.3 =
    // 9.899999999999999) surfacing raw on the shop floor's cut list.
    return [...totals.values()]
      .map((line) => ({ ...line, quantity: Math.round(line.quantity * 100) / 100 }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}
