import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CatalogListQuery, CreateColorDto, UpdateColorDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ColorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateColorDto) {
    await this.assertNameFree(businessId, dto.name);
    return this.prisma.color.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: CatalogListQuery) {
    const where = {
      businessId,
      isActive: query.isActive,
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.color.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.color.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateColorDto) {
    await this.assertExists(businessId, id);
    if (dto.name) {
      await this.assertNameFree(businessId, dto.name, id);
    }
    return this.prisma.color.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const color = await this.prisma.color.findFirst({ where: { id, businessId } });
    if (!color) {
      throw new NotFoundException("Color not found");
    }
    return color;
  }

  private async assertNameFree(businessId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.color.findUnique({ where: { businessId_name: { businessId, name } } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("A color with this name already exists");
    }
  }
}
