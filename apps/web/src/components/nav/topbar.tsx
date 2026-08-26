"use client";

import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

/** Desktop-only top bar: business switcher / notifications / logout. */
export function Topbar() {
  const { business, logout } = useAuth();

  return (
    <header className="hidden h-16 items-center justify-between border-b border-border/70 bg-surface px-7 md:flex">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border/70 bg-muted/60 pl-1.5 pr-3 text-[12.5px] font-semibold">
        <span className="h-[22px] w-[22px] rounded-md bg-primary" />
        {business?.name ?? "Al-Makan"}
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/60 hover:bg-muted"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <button
          aria-label="Log out"
          onClick={() => void logout()}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/60 hover:bg-muted"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
