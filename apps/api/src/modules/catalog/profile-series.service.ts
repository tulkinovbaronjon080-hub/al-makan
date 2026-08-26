import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateProfileSeriesDto, ProfileSeriesListQuery, UpdateProfileSeriesDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";
import { BrandsService } from "./brands.service";

@Injectable()
export class ProfileSeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brands: BrandsService,
  ) {}

  async create(businessId: string, dto: CreateProfileSeriesDto) {
    await this.brands.assertExists(businessId, dto.brandId);
    await this.assertNameFree(dto.brandId, dto.name);
    return this.prisma.profileSeries.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: ProfileSeriesListQuery) {
    const where = {
      businessId,
      isActive: query.isActive,
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.profileSeries.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.profileSeries.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateProfileSeriesDto) {
    const series = await this.assertExists(businessId, id);
    if (dto.name) {
      await this.assertNameFree(series.brandId, dto.name, id);
    }
    return this.prisma.profileSeries.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const series = await this.prisma.profileSeries.findFirst({ where: { id, businessId } });
    if (!series) {
      throw new NotFoundException("Profile series not found");
    }
    return series;
  }

  private async assertNameFree(brandId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.profileSeries.findUnique({ where: { brandId_name: { brandId, name } } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("A series with this name already exists for this brand");
    }
  }
}
