import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateCustomerDto, PaginationQuery, UpdateCustomerDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { businessId_phone: { businessId, phone: dto.phone } },
    });
    if (existing) {
      throw new ConflictException("A customer with this phone number already exists");
    }

    return this.prisma.customer.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, pagination: PaginationQuery, search?: string) {
    const where = {
      businessId,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, page: pagination.page, pageSize: pagination.pageSize, total };
  }

  async getOne(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: { orders: { orderBy: { createdAt: "desc" } } },
    });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }

  async update(businessId: string, id: string, dto: UpdateCustomerDto) {
    await this.assertExists(businessId, id);

    if (dto.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { businessId_phone: { businessId, phone: dto.phone } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException("A customer with this phone number already exists");
      }
    }

    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  private async assertExists(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, businessId } });
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }
}
