# @al-makan/database

Prisma schema + generated client, shared by `apps/api` (and read-only by `apps/web` server components where needed).

## Current scope (Phase 0)

Tenancy/identity + location primitives: `Business`, `User`, `BusinessMember`, `Role`, `Permission`, `RolePermission`, `Location`.

## Planned scope (added incrementally, one roadmap phase at a time)

- **CRM**: `Customer`
- **Catalog**: `ProductCategory`, `ProductType`, `Product`, `Brand`, `ProfileSeries`, `Profile`, `Glass`, `Color`, `Accessory`
- **Orders**: `Order`, `OrderItem`, `OrderStatusHistory`, `Measurement`, `ProductConfiguration`, `CalculationResult`, `BOM`, `BOMItem`
- **Production**: `ProductionOrder`, `ProductionStage`, `ProductionStepAssignment`, `Worker`, `QualityCheck`
- **Inventory**: `Material`, `InventoryStock`, `StockMovement`, `StockReservation`
- **Transfers**: `Transfer`, `TransferItem`
- **Purchasing**: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `SupplierPayment`
- **Store/POS**: `Sale`, `SaleItem`, `Return`, `ReturnItem`
- **Finance**: `Payment`, `Expense`
- **Platform**: `Notification`, `AuditLog`, `Subscription`

Don't add tables ahead of the module that needs them — see the roadmap in the Phase 0 plan.

## Local dev

```bash
cp .env.example .env
pnpm db:migrate   # from repo root
pnpm db:studio
```
