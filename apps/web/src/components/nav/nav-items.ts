import { ClipboardList, LayoutDashboard, Package, MoreHorizontal } from "lucide-react";

/**
 * Single source of truth for primary navigation, shared by the mobile
 * bottom nav and the desktop sidebar so the two never drift out of sync.
 * Phase 1+ appends module entries here as they land; mobile always shows
 * a fixed 5-slot bar (with a "+" create action inserted separately) per
 * the brief, desktop reuses the same list until it outgrows it.
 */
export const primaryNavItems = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/inventory", labelKey: "inventory", icon: Package },
  { href: "/more", labelKey: "more", icon: MoreHorizontal },
] as const;
