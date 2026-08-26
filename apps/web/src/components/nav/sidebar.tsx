"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@al-makan/ui";
import { desktopNavItems } from "./nav-items";
import { getDictionary } from "@/lib/i18n/dictionary";
import { useAuth } from "@/lib/auth/auth-context";
import { BrandMark } from "@/components/brand-mark";

const dict = getDictionary();

/** Persistent desktop sidebar. Hidden below md — mobile uses BottomNav instead. */
export function Sidebar() {
  const pathname = usePathname();
  const { user, role, permissions } = useAuth();
  const initials = user?.fullName ? getInitials(user.fullName) : "";
  const visibleItems = desktopNavItems.filter((item) => !item.permission || permissions.includes(item.permission));

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-surface border-r border-border/70 p-4 md:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <BrandMark className="h-8 w-8 rounded-lg" iconClassName="h-4 w-4" />
        <span className="text-[15px] font-bold tracking-tight">Al-Makan</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const label = dict.nav[item.labelKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-surface-foreground",
              )}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 rounded-lg bg-muted p-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[12px] font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold">{user?.fullName}</div>
          <div className="truncate text-[10.5px] text-muted-foreground">{role?.name}</div>
        </div>
      </div>
    </aside>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
