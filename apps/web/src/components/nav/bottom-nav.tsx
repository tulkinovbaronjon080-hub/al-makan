"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@al-makan/ui";
import { primaryNavItems } from "./nav-items";
import { getDictionary } from "@/lib/i18n/dictionary";

const dict = getDictionary();

/**
 * Fixed 5-slot mobile bottom nav: Home, Orders, + (create), Inventory,
 * More. No permanent sidebar on mobile — this is the only mobile nav.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [home, orders, inventory, more] = primaryNavItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <NavLink item={home} active={pathname === home.href} />
      <NavLink item={orders} active={pathname.startsWith(orders.href)} />

      <div className="flex flex-1 items-center justify-center">
        <Link
          href="/create"
          aria-label={dict.nav.create}
          className="flex h-touch w-touch items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      <NavLink item={inventory} active={pathname.startsWith(inventory.href)} />
      <NavLink item={more} active={pathname.startsWith(more.href)} />
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof primaryNavItems)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  const label = dict.nav[item.labelKey];

  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
