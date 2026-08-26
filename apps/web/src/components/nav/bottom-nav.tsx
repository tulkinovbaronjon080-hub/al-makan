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
      className="fixed inset-x-0 bottom-0 z-40 flex h-[76px] items-stretch border-t border-border bg-surface pb-2.5 md:hidden"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))" }}
    >
      <NavLink item={home} active={pathname === home.href} />
      <NavLink item={orders} active={pathname.startsWith(orders.href)} />

      <div className="flex flex-1 items-start justify-center">
        <Link
          href="/create"
          aria-label={dict.nav.create}
          className="-mt-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-2xl border-[3px] border-surface bg-primary text-primary-foreground shadow-[0_10px_20px_-4px_hsl(var(--primary)/0.55)] transition-transform active:scale-95"
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
        "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-wide",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
      {label}
    </Link>
  );
}
