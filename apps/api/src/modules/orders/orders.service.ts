import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateOrderDto, OrderStatus, PaginationQuery, UpdateOrderDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

const customerSummarySelect = { id: true, fullName: true, phone: true } as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, actorUserId: string, dto: CreateOrderDto) {
    await this.assertCustomerInBusiness(businessId, dto.customerId);

    return this.prisma.$transaction(async (tx) => {
      // Atomic per-business counter — no separate max()+1 query, so no race
      // condition between two concurrent order creations for this business.
      const business = await tx.business.update({
        where: { id: businessId },
        data: { nextOrderNumber: { increment: 1 } },
      });
      const orderNumber = business.nextOrderNumber - 1;

      const order = await tx.order.create({
        data: {
          businessId,
          orderNumber,
          customerId: dto.customerId,
          notes: dto.notes,
        },
        include: { customer: { select: customerSummarySelect } },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "NEW", changedByUserId: actorUserId },
      });

      return order;
    });
  }

  async list(businessId: string, pagination: PaginationQuery, status?: OrderStatus, search?: string) {
    const where = {
      businessId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            customer: {
              OR: [
                { fullName: { contains: search, mode: "insensitive" as const } },
                { phone: { contains: search } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { customer: { select: customerSummarySelect } },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, page: pagination.page, pageSize: pagination.pageSize, total };
  }

  async getOne(businessId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async update(businessId: string, id: string, dto: UpdateOrderDto) {
    await this.assertOrderInBusiness(businessId, id);
    if (dto.customerId) {
      await this.assertCustomerInBusiness(businessId, dto.customerId);
    }

    return this.prisma.order.update({
      where: { id },
      data: dto,
      include: { customer: { select: customerSummarySelect } },
    });
  }

  async updateStatus(businessId: string, id: string, actorUserId: string, status: OrderStatus, note?: string) {
    await this.assertOrderInBusiness(businessId, id);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status },
        include: { customer: { select: customerSummarySelect } },
      });
      await tx.orderStatusHistory.create({
        data: { orderId: id, status, changedByUserId: actorUserId, note },
      });
      return order;
    });
  }

  private async assertOrderInBusiness(businessId: string, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, businessId } });
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  private async assertCustomerInBusiness(businessId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, businessId } });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }
}
