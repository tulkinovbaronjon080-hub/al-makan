import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateProfileDto, ProfileListQuery, UpdateProfileDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";
import { ProfileSeriesService } from "./profile-series.service";

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly series: ProfileSeriesService,
  ) {}

  async create(businessId: string, dto: CreateProfileDto) {
    await this.series.assertExists(businessId, dto.seriesId);
    await this.assertNameFree(dto.seriesId, dto.name);
    return this.prisma.profile.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: ProfileListQuery) {
    const where = {
      businessId,
      isActive: query.isActive,
      ...(query.seriesId ? { seriesId: query.seriesId } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateProfileDto) {
    const profile = await this.assertExists(businessId, id);
    if (dto.name) {
      await this.assertNameFree(profile.seriesId, dto.name, id);
    }
    return this.prisma.profile.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const profile = await this.prisma.profile.findFirst({ where: { id, businessId } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  private async assertNameFree(seriesId: string, name: string, excludeId?: string) {
    const existing = await this.prisma.profile.findUnique({ where: { seriesId_name: { seriesId, name } } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException("A profile with this name already exists for this series");
    }
  }
}
