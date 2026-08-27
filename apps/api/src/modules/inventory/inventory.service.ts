import { BadRequestException, Injectable } from "@nestjs/common";
import { MATERIAL_TYPE_UNIT, type ListMovementsQuery, type MaterialType, type RecordMovementDto } from "@al-makan/types";
import type { Prisma } from "@al-makan/database";
import { PrismaService } from "../../prisma/prisma.service";
import { LocationsService } from "../locations/locations.service";
import { ProfilesService } from "../catalog/profiles.service";
import { GlassService } from "../catalog/glass.service";
import { AccessoriesService } from "../catalog/accessories.service";

export interface StockRequirement {
  materialType: MaterialType;
  materialId: string;
  label: string;
  quantity: number;
}

/**
 * InventoryItem (current balance) + StockMovement (append-only ledger) —
 * see the Phase 7 plan. Balance changes always go through applyDelta, an
 * atomic `{ increment }` upsert mirroring Business.nextOrderNumber's own
 * race-free counter pattern, so concurrent movements on the same
 * (location, material) serialize on Postgres's row lock instead of racing
 * a read-then-write. consumeForOrder accepts the caller's own transaction
 * client so ProductionService.startProduction can fold stock consumption
 * into its single atomic transaction alongside task creation.
 */
@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationsService,
    private readonly profiles: ProfilesService,
    private readonly glass: GlassService,
    private readonly accessories: AccessoriesService,
  ) {}

  async getStock(businessId: string, locationId?: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { location: { businessId }, ...(locationId ? { locationId } : {}) },
      include: { location: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    const resolveLabel = await this.buildLabelResolver(businessId, items);

    return items.map((item) => ({
      locationId: item.locationId,
      locationName: item.location.name,
      materialType: item.materialType,
      materialId: item.materialId,
      label: resolveLabel(item.materialType, item.materialId),
      quantity: item.quantity,
      unit: MATERIAL_TYPE_UNIT[item.materialType],
    }));
  }

  async listMovements(businessId: string, query: ListMovementsQuery) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { location: { businessId }, ...(query.locationId ? { locationId: query.locationId } : {}) },
      include: { location: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const resolveLabel = await this.buildLabelResolver(businessId, movements);

    return movements.map((m) => ({
      id: m.id,
      locationId: m.locationId,
      locationName: m.location.name,
      materialType: m.materialType,
      materialId: m.materialId,
      label: resolveLabel(m.materialType, m.materialId),
      type: m.type,
      quantityDelta: m.quantityDelta,
      note: m.note,
      orderId: m.orderId,
      createdAt: m.createdAt,
    }));
  }

  async recordMovement(businessId: string, actorUserId: string, dto: RecordMovementDto) {
    await this.locations.assertActiveInBusiness(businessId, dto.locationId);
    await this.assertMaterialExists(businessId, dto.materialType, dto.materialId);

    return this.prisma.$transaction(async (tx) => {
      await this.applyDelta(tx, dto.locationId, dto.materialType, dto.materialId, dto.quantityDelta);
      return tx.stockMovement.create({
        data: {
          locationId: dto.locationId,
          materialType: dto.materialType,
          materialId: dto.materialId,
          type: dto.type,
          quantityDelta: Math.round(dto.quantityDelta * 100) / 100,
          note: dto.note,
          changedByUserId: actorUserId,
        },
      });
    });
  }

  /**
   * Called by ProductionService.startProduction inside its own transaction
   * — checks every requirement against current stock first, for one
   * combined shortfall message, then decrements each atomically. The
   * per-material check inside applyDelta is the race-safe backstop if
   * stock changes between the pre-check and the decrement.
   */
  async consumeForOrder(
    tx: Prisma.TransactionClient,
    businessId: string,
    locationId: string,
    orderId: string,
    actorUserId: string,
    requirements: StockRequirement[],
  ) {
    await this.locations.assertActiveInBusiness(businessId, locationId);

    const balances = await tx.inventoryItem.findMany({
      where: {
        locationId,
        OR: requirements.map((r) => ({ materialType: r.materialType, materialId: r.materialId })),
      },
    });
    const balanceMap = new Map(balances.map((b) => [`${b.materialType}:${b.materialId}`, b.quantity]));

    const shortfalls = requirements
      .map((r) => {
        const available = balanceMap.get(`${r.materialType}:${r.materialId}`) ?? 0;
        const short = Math.round((r.quantity - available) * 100) / 100;
        return short > 0 ? `${r.label} short by ${short} ${MATERIAL_TYPE_UNIT[r.materialType]}` : null;
      })
      .filter((s): s is string => s !== null);
    if (shortfalls.length > 0) {
      throw new BadRequestException(`Insufficient stock to start production: ${shortfalls.join(", ")}`);
    }

    for (const r of requirements) {
      await this.applyDelta(tx, locationId, r.materialType, r.materialId, -r.quantity);
      await tx.stockMovement.create({
        data: {
          locationId,
          materialType: r.materialType,
          materialId: r.materialId,
          type: "PRODUCTION_CONSUME",
          quantityDelta: -Math.round(r.quantity * 100) / 100,
          orderId,
          changedByUserId: actorUserId,
        },
      });
    }
  }

  private async applyDelta(
    tx: Prisma.TransactionClient,
    locationId: string,
    materialType: MaterialType,
    materialId: string,
    delta: number,
  ) {
    const roundedDelta = Math.round(delta * 100) / 100;
    const updated = await tx.inventoryItem.upsert({
      where: { locationId_materialType_materialId: { locationId, materialType, materialId } },
      create: { locationId, materialType, materialId, quantity: roundedDelta },
      update: { quantity: { increment: roundedDelta } },
    });
    if (updated.quantity < 0) {
      throw new BadRequestException("Insufficient stock — this would take the balance below zero");
    }
    return updated;
  }

  private async assertMaterialExists(businessId: string, materialType: MaterialType, materialId: string) {
    switch (materialType) {
      case "PROFILE":
        await this.profiles.assertExists(businessId, materialId);
        return;
      case "GLASS":
        await this.glass.assertExists(businessId, materialId);
        return;
      case "ACCESSORY":
        await this.accessories.assertExists(businessId, materialId);
        return;
      case "SEAL":
        if (materialId !== "seal") {
          throw new BadRequestException('Seal material id must be "seal"');
        }
        return;
    }
  }

  private async buildLabelResolver(
    businessId: string,
    refs: Array<{ materialType: MaterialType; materialId: string }>,
  ) {
    const idsByType = (type: MaterialType) =>
      [...new Set(refs.filter((r) => r.materialType === type).map((r) => r.materialId))];

    const [profiles, glasses, accessories] = await Promise.all([
      this.prisma.profile.findMany({ where: { id: { in: idsByType("PROFILE") }, businessId }, select: { id: true, name: true } }),
      this.prisma.glass.findMany({ where: { id: { in: idsByType("GLASS") }, businessId }, select: { id: true, name: true } }),
      this.prisma.accessory.findMany({ where: { id: { in: idsByType("ACCESSORY") }, businessId }, select: { id: true, name: true } }),
    ]);

    const labels = new Map<string, string>();
    for (const p of profiles) labels.set(`PROFILE:${p.id}`, `Profile — ${p.name}`);
    for (const g of glasses) labels.set(`GLASS:${g.id}`, `Glass — ${g.name}`);
    for (const a of accessories) labels.set(`ACCESSORY:${a.id}`, a.name);

    return (materialType: MaterialType, materialId: string) =>
      materialType === "SEAL" ? "Rubber/seal" : (labels.get(`${materialType}:${materialId}`) ?? materialId);
  }
}
