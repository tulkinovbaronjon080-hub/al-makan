"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@al-makan/ui";
import { primaryNavItems } from "./nav-items";
import { getDictionary } from "@/lib/i18n/dictionary";

const dict = getDictionary();

/** Persistent desktop sidebar. Hidden below md — mobile uses BottomNav instead. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center px-5">
        <span className="text-lg font-semibold tracking-tight">Al-Makan</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const label = dict.nav[item.labelKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-surface-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
