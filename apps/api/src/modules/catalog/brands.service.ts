import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CatalogListQuery, CreateBrandDto, UpdateBrandDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateBrandDto) {
    await this.assertNameFree(businessId, dto.name);
    return this.prisma.brand.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: CatalogListQuery) {
    const where = {
      businessId,
      isActive: query.isActive,
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateBrandDto) {
    await this.assertExists(businessId, id);
    if (dto.name) {
      await this.assertNameFree(businessId, dto.name, id);
    }
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const brand = await this.prisma.brand.findFirst({ where: { id, businessId } });
    if (!brand) {
      throw new NotFoundException("Brand not found");
    }
    return brand;
  }

  private async assertNameFree(businessId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.brand.findUnique({ where: { businessId_name: { businessId, name } } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("A brand with this name already exists");
    }
  }
}
