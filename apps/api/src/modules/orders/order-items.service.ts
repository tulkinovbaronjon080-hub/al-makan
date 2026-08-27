import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { calculateProductConfiguration } from "@al-makan/calculation-engine";
import type { CreateOrderItemDto } from "@al-makan/types";
import type { Prisma } from "@al-makan/database";
import { PrismaService } from "../../prisma/prisma.service";
import { OrdersService } from "./orders.service";
import { ProfilesService } from "../catalog/profiles.service";
import { GlassService } from "../catalog/glass.service";
import { ColorsService } from "../catalog/colors.service";
import { AccessoriesService } from "../catalog/accessories.service";

const catalogRefSelect = { id: true, name: true } as const;

/**
 * Server-side recompute is authoritative — whatever price the client's
 * live preview showed is discarded; only what calculateProductConfiguration
 * returns here gets persisted. See the Phase 4 plan: this still calls the
 * Phase 0 placeholder formula unchanged (Phase 5 replaces its internals).
 */
@Injectable()
export class OrderItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly profiles: ProfilesService,
    private readonly glass: GlassService,
    private readonly colors: ColorsService,
    private readonly accessories: AccessoriesService,
  ) {}

  async create(businessId: string, orderId: string, dto: CreateOrderItemDto) {
    await this.orders.assertOrderInBusiness(businessId, orderId);

    const [profile, glass, color] = await Promise.all([
      this.profiles.assertExists(businessId, dto.profileId),
      this.glass.assertExists(businessId, dto.glassId),
      this.colors.assertExists(businessId, dto.colorId),
    ]);
    if (!profile.isActive || !glass.isActive || !color.isActive) {
      throw new BadRequestException("Profile, glass, and color must all be active to use in a new order item");
    }
    await this.accessories.assertAllActiveAndInBusiness(businessId, dto.accessoryIds);

    const result = calculateProductConfiguration({
      productType: dto.productType,
      widthMm: dto.widthMm,
      heightMm: dto.heightMm,
      sections: dto.sections,
      profileId: dto.profileId,
      glassId: dto.glassId,
      colorId: dto.colorId,
      accessoryIds: dto.accessoryIds,
      quantity: dto.quantity,
    });

    return this.prisma.orderItem.create({
      data: {
        orderId,
        productType: dto.productType,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        sections: dto.sections,
        openingDirection: dto.openingDirection,
        profileId: dto.profileId,
        glassId: dto.glassId,
        colorId: dto.colorId,
        accessoryIds: dto.accessoryIds,
        quantity: dto.quantity,
        materialCost: result.materialCost,
        laborCost: result.laborCost,
        additionalCost: result.additionalCost,
        totalCost: result.totalCost,
        margin: result.margin,
        sellingPrice: result.sellingPrice,
        bom: result.bom as unknown as Prisma.InputJsonValue,
      },
      include: {
        profile: { select: catalogRefSelect },
        glass: { select: catalogRefSelect },
        color: { select: catalogRefSelect },
      },
    });
  }

  async remove(businessId: string, orderId: string, itemId: string) {
    await this.orders.assertOrderInBusiness(businessId, orderId);

    const item = await this.prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!item) {
      throw new NotFoundException("Order item not found");
    }

    await this.prisma.orderItem.delete({ where: { id: itemId } });
  }
}
