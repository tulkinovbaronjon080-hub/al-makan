import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CatalogListQuery, CreateGlassDto, UpdateGlassDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GlassService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateGlassDto) {
    await this.assertNameFree(businessId, dto.name);
    return this.prisma.glass.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: CatalogListQuery) {
    const where = {
      businessId,
      isActive: query.isActive,
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.glass.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.glass.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateGlassDto) {
    await this.assertExists(businessId, id);
    if (dto.name) {
      await this.assertNameFree(businessId, dto.name, id);
    }
    return this.prisma.glass.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const glass = await this.prisma.glass.findFirst({ where: { id, businessId } });
    if (!glass) {
      throw new NotFoundException("Glass not found");
    }
    return glass;
  }

  private async assertNameFree(businessId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.glass.findUnique({ where: { businessId_name: { businessId, name } } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("A glass type with this name already exists");
    }
  }
}
