import { ClipboardList, LayoutDashboard, Package, MoreHorizontal, Users } from "lucide-react";

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

export const desktopNavItems = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/customers", labelKey: "customers", icon: Users },
  { href: "/inventory", labelKey: "inventory", icon: Package },
] as const;
