import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateLocationDto, LocationListQuery, UpdateLocationDto } from "@al-makan/types";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(businessId: string, dto: CreateLocationDto) {
    return this.prisma.location.create({ data: { businessId, ...dto } });
  }

  async list(businessId: string, query: LocationListQuery) {
    const where = { businessId, isActive: query.isActive };

    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.location.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async update(businessId: string, id: string, dto: UpdateLocationDto) {
    await this.assertExists(businessId, id);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async assertExists(businessId: string, id: string) {
    const location = await this.prisma.location.findFirst({ where: { id, businessId } });
    if (!location) {
      throw new NotFoundException("Location not found");
    }
    return location;
  }

  /** Used by InventoryService before touching stock at a location. */
  async assertActiveInBusiness(businessId: string, id: string) {
    const location = await this.assertExists(businessId, id);
    if (!location.isActive) {
      throw new BadRequestException("This location is disabled");
    }
    return location;
  }
}
