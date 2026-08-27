import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CatalogListQuery, CreateAccessoryDto, UpdateAccessoryDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AccessoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateAccessoryDto) {
    await this.assertNameFree(businessId, dto.name);
    return this.prisma.accessory.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: CatalogListQuery) {
    const where = {
      businessId,
      isActive: query.isActive,
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.accessory.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.accessory.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateAccessoryDto) {
    await this.assertExists(businessId, id);
    if (dto.name) {
      await this.assertNameFree(businessId, dto.name, id);
    }
    return this.prisma.accessory.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const accessory = await this.prisma.accessory.findFirst({ where: { id, businessId } });
    if (!accessory) {
      throw new NotFoundException("Accessory not found");
    }
    return accessory;
  }

  /**
   * Confirms every id belongs to this business and is active, and returns
   * the rows (with prices) — used when attaching accessories to a new
   * OrderItem, both to validate the selection and to price it.
   */
  async assertAllActiveAndInBusiness(businessId: string, ids: string[]) {
    if (ids.length === 0) return [];
    const found = await this.prisma.accessory.findMany({
      where: { id: { in: ids }, businessId, isActive: true },
    });
    if (found.length !== new Set(ids).size) {
      throw new BadRequestException("One or more accessories are invalid or unavailable");
    }
    return found;
  }

  private async assertNameFree(businessId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.accessory.findUnique({ where: { businessId_name: { businessId, name } } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("An accessory with this name already exists");
    }
  }
}
