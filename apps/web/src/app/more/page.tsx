"use client";

import Link from "next/link";
import { ChevronRight, LogOut, Settings, Users } from "lucide-react";
import { Card } from "@al-makan/ui";
import { useAuth } from "@/lib/auth/auth-context";

// Mobile has no Topbar (bottom-nav only, per brief §6), so this is where
// the account/logout action and secondary destinations live on mobile.
export default function MorePage() {
  const { user, business, role, logout, permissions } = useAuth();
  const initials = user?.fullName ? getInitials(user.fullName) : "";
  const canManageCatalog = permissions.includes("catalog.manage");

  return (
    <div className="mx-auto max-w-md space-y-5 p-4 md:p-6">
      <Card className="flex items-center gap-3 border border-border/70 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold">{user?.fullName}</p>
          <p className="truncate text-[11.5px] text-muted-foreground">{user?.email}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-primary">
            {business?.name} &middot; {role?.name}
          </p>
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-surface">
        <Link href="/customers" className="flex items-center gap-3 px-4 py-3.5">
          <Users className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.75} />
          <span className="flex-1 text-[13.5px] font-semibold">Customers</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        </Link>
        {canManageCatalog && (
          <Link href="/settings/catalog" className="flex items-center gap-3 border-t border-border/60 px-4 py-3.5">
            <Settings className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.75} />
            <span className="flex-1 text-[13.5px] font-semibold">Catalog settings</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          </Link>
        )}
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3.5 text-left"
        >
          <LogOut className="h-[18px] w-[18px] text-danger" strokeWidth={1.75} />
          <span className="flex-1 text-[13.5px] font-semibold text-danger">Log out</span>
        </button>
      </div>
    </div>
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
