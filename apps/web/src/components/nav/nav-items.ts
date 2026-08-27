import { ClipboardList, Factory, LayoutDashboard, Package, MoreHorizontal, Settings, Users, Warehouse } from "lucide-react";
import type { PermissionKey } from "@al-makan/types";

/**
 * Single source of truth for primary navigation. Mobile always shows a
 * fixed 5-slot bar (with a "+" create action inserted separately) per the
 * brief; desktop has room to expose more without complicating mobile, so
 * it gets its own list (§ brief: "Desktop should expose more information
 * without making the mobile UI complicated").
 */
export const primaryNavItems = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/inventory", labelKey: "inventory", icon: Package },
  { href: "/more", labelKey: "more", icon: MoreHorizontal },
] as const;

// `permission` gates an item behind a permission key — only shown when
// the current user's session has it (see Sidebar/More, which both filter
// on this the same way).
export const desktopNavItems: Array<{
  href: string;
  labelKey: "home" | "orders" | "customers" | "inventory" | "production" | "locations" | "settings";
  icon: typeof LayoutDashboard;
  permission?: PermissionKey;
}> = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/customers", labelKey: "customers", icon: Users },
  { href: "/inventory", labelKey: "inventory", icon: Package },
  { href: "/production", labelKey: "production", icon: Factory, permission: "production.manage" },
  { href: "/settings/locations", labelKey: "locations", icon: Warehouse, permission: "locations.manage" },
  { href: "/settings/catalog", labelKey: "settings", icon: Settings, permission: "catalog.manage" },
];
