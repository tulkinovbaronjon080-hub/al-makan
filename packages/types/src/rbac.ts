/**
 * Single source of truth for the RBAC catalog — consumed by
 * packages/database/prisma/seed.ts (to populate Role/Permission/
 * RolePermission rows) and by apps/api's @RequirePermissions() call sites
 * (as a typed union, so a typo'd permission key is a compile error, not a
 * silent always-fails-authorization bug).
 *
 * Covers both what Phase 1 enforces today (business.*, users.*) and the
 * modules already scaffolded as empty folders in apps/api/src/modules —
 * cheap to seed now, avoids a re-seed migration when those modules land.
 */

export const PERMISSION_KEYS = [
  "business.manage",
  "users.manage",
  "orders.create",
  "orders.edit",
  "orders.view",
  "inventory.view",
  "inventory.adjust",
  "inventory.transfer",
  "production.manage",
  "store.sell",
  "store.return",
  "purchases.manage",
  "finance.view",
  "reports.view",
  "locations.manage",
  "locations.view",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  "business.manage": "Edit business settings",
  "users.manage": "Invite/edit team members and their roles",
  "orders.create": "Create customer orders",
  "orders.edit": "Edit customer orders",
  "orders.view": "View customer orders",
  "inventory.view": "View stock levels",
  "inventory.adjust": "Adjust stock (damage, correction)",
  "inventory.transfer": "Transfer stock between locations",
  "production.manage": "Manage production orders and stages",
  "store.sell": "Sell products at the POS",
  "store.return": "Process POS returns",
  "purchases.manage": "Manage suppliers and purchase orders",
  "finance.view": "View payments, debt, and financial reports",
  "reports.view": "View business reports",
  "locations.manage": "Create/edit warehouses and stores",
  "locations.view": "View warehouses and stores",
};

export const SYSTEM_ROLES = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "SALES",
  "MEASUREMENT",
  "PRODUCTION",
  "WAREHOUSE",
  "STORE_CASHIER",
  "INSTALLER",
] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

const ALL_PERMISSIONS = [...PERMISSION_KEYS];
const ALL_EXCEPT_BUSINESS_MANAGE = PERMISSION_KEYS.filter((k) => k !== "business.manage");

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, PermissionKey[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_EXCEPT_BUSINESS_MANAGE,
  MANAGER: [
    "users.manage",
    "orders.create",
    "orders.edit",
    "orders.view",
    "production.manage",
    "inventory.view",
    "locations.view",
    "reports.view",
  ],
  SALES: ["orders.create", "orders.view"],
  MEASUREMENT: ["orders.view", "orders.edit"],
  PRODUCTION: ["production.manage", "inventory.view"],
  WAREHOUSE: ["inventory.view", "inventory.adjust", "inventory.transfer", "locations.view"],
  STORE_CASHIER: ["store.sell", "store.return", "inventory.view"],
  INSTALLER: ["orders.view"],
};
